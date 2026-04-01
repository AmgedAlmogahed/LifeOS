import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSignedFileUrl } from "@/lib/actions/storage";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    const agentToken = process.env.AGENT_API_KEY;

    if (!agentToken || authHeader !== `Bearer ${agentToken}`) {
        return NextResponse.json({ error: "Unauthorized Agent Access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("project_id");
    const clientId = searchParams.get("client_id");
    const documentId = searchParams.get("document_id");

    try {
        // 1. Single Document Detail
        if (documentId) {
            const { data: doc, error } = await supabase
                .from("documents" as any)
                .select("*")
                .eq("id", documentId)
                .single();

            if (error) throw error;
            if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

            // Fetch signed URL for the raw file
            const signedUrl = await getSignedFileUrl("documents", doc.storage_path);

            return NextResponse.json({
                document: doc,
                download_url: signedUrl
            });
        }

        // 2. Project/Client Document List
        let query = supabase.from("documents" as any).select("id, name, category, ai_summary, ai_key_points, summary_generated_at, is_context_active");
        
        if (projectId) {
            query = query.eq("project_id", projectId);
        } else if (clientId) {
            query = query.eq("client_id", clientId);
        } else {
            return NextResponse.json({ error: "Missing project_id or client_id" }, { status: 400 });
        }

        const { data: documents, error: docError } = await query.order("created_at", { ascending: false });
        if (docError) throw docError;

        // Also fetch the current context bundle
        let bundleQuery = supabase.from("context_bundles" as any).select("*");
        if (projectId) {
            bundleQuery = bundleQuery.eq("project_id", projectId).eq("bundle_type", "project");
        } else {
            bundleQuery = bundleQuery.eq("client_id", clientId).eq("bundle_type", "client");
        }
        
        const { data: bundle } = await bundleQuery.maybeSingle();

        return NextResponse.json({
            documents,
            context_bundle: bundle,
            metadata: {
                total_count: documents?.length || 0,
                is_stale: bundle?.is_stale || false
            }
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
