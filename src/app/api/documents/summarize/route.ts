import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

import mammoth from "mammoth";
import { markContextStale } from "@/lib/actions/documents";

// Backend client to bypass RLS for systemic summarization
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST(req: NextRequest) {
  const { document_id } = await req.json();

  if (!document_id) {
    return NextResponse.json({ error: "Missing document_id" }, { status: 400 });
  }

  try {
    // 1. Fetch document record
    const { data: doc, error: fetchError } = await (supabase
      .from("documents") as any)
      .select("*")
      .eq("id", document_id)
      .single();

    if (fetchError || !doc) throw new Error("Document not found");

    // 2. Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(doc.file_url);

    if (downloadError) throw new Error("Failed to download file");

    const buffer = Buffer.from(await fileData.arrayBuffer());
    let text = "";

    // 3. Extract text
    if (doc.file_type === "application/pdf") {
      const pdf = require("pdf-parse");
      const pdfData = await pdf(buffer);
      text = pdfData.text;
    } else if (doc.file_type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (doc.file_type === "text/plain" || doc.file_type === "text/markdown") {
      text = buffer.toString("utf-8");
    } else {
      text = "This file type is not supported for text extraction.";
    }

    if (!text || text.trim().length < 10) {
        throw new Error("Extracted text is too short or empty.");
    }

    // 4. Summarize via Gemini
    const prompt = `
      Summarize the following document in 3-5 concise sentences. 
      Then list 5-8 key points as bullet points. 
      Then extract entities: names, dates, monetary amounts, companies, deadlines.
      
      Return as JSON ONLY in this format: 
      { 
        "summary": "...", 
        "key_points": ["...", "..."], 
        "entities": { 
          "names": ["..."], 
          "dates": ["..."], 
          "amounts": ["..."], 
          "companies": ["..."], 
          "deadlines": ["..."] 
        } 
      }
      
      Document text:
      ${text.substring(0, 10000)} // Limiting to 10k chars for sanity
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    const aiData = JSON.parse(cleanJson);

    // 5. Update document record
    const { error: updateError } = await (supabase
      .from("documents") as any)
      .update({
        ai_summary: aiData.summary,
        ai_key_points: aiData.key_points,
        ai_entities: aiData.entities,
        summary_generated_at: new Date().toISOString(),
      })
      .eq("id", document_id);

    if (updateError) throw updateError;

    // 6. Mark context bundle as stale
    if (doc.client_id) await markContextStale("client", doc.client_id);
    if (doc.project_id) await markContextStale("project", doc.project_id);

    return NextResponse.json({ success: true, summary: aiData.summary });
  } catch (err: any) {
    console.error("Summarization Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
