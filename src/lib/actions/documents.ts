"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type DocumentCategory = 
    | "contract" 
    | "proposal" 
    | "brief" 
    | "requirements" 
    | "design" 
    | "invoice" 
    | "correspondence" 
    | "reference" 
    | "internal" 
    | "general";

interface CreateDocumentParams {
    client_id?: string | null;
    project_id?: string | null;
    title: string;
    file_url: string;
    file_name: string;
    file_type: string;
    file_size_bytes: number;
    category?: string;
    tags?: string[];
    is_context_active?: boolean;
}

/**
 * Creates a new document record and marks context as stale.
 */
export async function createDocument(params: CreateDocumentParams) {
    const supabase = await createClient();
    
    const { data, error } = await (supabase.from("documents") as any).insert({
        ...params,
        uploaded_by: "user",
        summary_generated_at: null, // Pending AI
    }).select().single();

    if (error) throw error;
    
    // Mark context bundle as stale
    if (params.client_id) await markContextStale("client", params.client_id);
    if (params.project_id) await markContextStale("project", params.project_id);

    revalidatePath("/clients");
    revalidatePath("/projects");
    return data;
}

/**
 * Marks a context bundle as stale so it knows it needs regeneration.
 */
export async function markContextStale(type: 'client' | 'project', entityId: string) {
    const supabase = await createClient();
    
    // Upsert a stale record
    const { error } = await (supabase as any).from("context_bundles").upsert({
        client_id: type === 'client' ? entityId : null,
        project_id: type === 'project' ? entityId : null,
        bundle_type: type,
        is_stale: true,
    }, { onConflict: 'client_id, project_id, bundle_type' });

    if (error) {
        // If conflict on multiple columns fails, try simple select-update/insert
        console.error("Failed to mark context stale:", error.message);
    }
}

/**
 * Compiles a context bundle from all active documents.
 */
export async function generateContextBundle(type: 'client' | 'project', entityId: string) {
    const supabase = await createClient();
    
    const query = supabase.from("documents").select("*").eq("is_context_active", true);
    if (type === 'client') query.eq("client_id", entityId);
    else query.eq("project_id", entityId);
    
    const { data: documents, error: docsError } = await (query as any);
    if (docsError) throw docsError;

    // Fetch entity name for header
    let entityName = "Unknown";
    if (type === 'client') {
        const { data: client } = await supabase.from("clients").select("name").eq("id", entityId).single();
        if (client) entityName = client.name;
    } else {
        const { data: project } = await supabase.from("projects").select("name").eq("id", entityId).single();
        if (project) entityName = project.name;
    }

    let markdown = `# ${type === 'client' ? 'Client' : 'Project'}: ${entityName}\n\n`;
    markdown += `## Key Documents\n\n`;

    if (!documents || documents.length === 0) {
        markdown += "_No documents indexed in context._";
    } else {
        documents.forEach((doc: any) => {
            markdown += `### ${doc.category.toUpperCase()} — ${doc.title} (uploaded ${new Date(doc.created_at).toLocaleDateString()})\n`;
            markdown += `[Summary]: ${doc.ai_summary || "Pending AI summarization..."}\n`;
            if (doc.ai_key_points?.length > 0) {
                markdown += `[Key Points]: ${doc.ai_key_points.join(" • ")}\n`;
            }
            if (doc.ai_entities && Object.keys(doc.ai_entities).length > 0) {
              const entities = doc.ai_entities;
              const entityStr = Object.entries(entities)
                .filter(([_, val]) => Array.isArray(val) && val.length > 0)
                .map(([key, val]) => `${key}: ${(val as string[]).join(", ")}`)
                .join(" | ");
              if (entityStr) markdown += `[Entities]: ${entityStr}\n`;
            }
            markdown += `\n`;
        });
    }

    // Save the bundle
    const { error: bundleError } = await (supabase as any).from('context_bundles').upsert({
        client_id: type === 'client' ? entityId : null,
        project_id: type === 'project' ? entityId : null,
        bundle_type: type,
        context_text: markdown,
        document_ids: documents.map((d: any) => d.id),
        is_stale: false,
        generated_at: new Date().toISOString(),
    });

    if (bundleError) throw bundleError;
    return markdown;
}

export async function deleteDocument(id: string) {
    const supabase = await createClient();
    const { data: doc } = await (supabase.from("documents") as any).select("client_id, project_id, file_url").eq("id", id).single();
    
    if (doc) {
        // Delete from DB
        await (supabase.from("documents") as any).delete().eq("id", id);
        
        // Mark context stale
        if (doc.client_id) await markContextStale("client", doc.client_id);
        if (doc.project_id) await markContextStale("project", doc.project_id);
        
        // Note: Real file deletion from storage should be handled by the caller or here if needed
    }
    
    revalidatePath("/clients");
}
