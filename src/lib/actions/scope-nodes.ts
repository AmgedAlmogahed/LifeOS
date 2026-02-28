"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// DB column is `title` (NOT `label`) — confirmed from information_schema
// `scope_nodes` table not in generated types yet, cast `supabase as any` before .from()
export interface ScopeNode {
    id: string;
    project_id: string;
    parent_id: string | null;
    title: string;           // ← actual DB column name
    node_type: string;       // DB default: 'Module'
    status: string;          // DB default: 'Pending'
    completion_percentage: number;
    created_at: string;
    updated_at: string;
    // Virtual (only on client after buildTree)
    children?: ScopeNode[];
}

export async function getScopeNodes(projectId: string): Promise<ScopeNode[]> {
    const supabase = await createClient();
    const db = supabase as any;
    const { data, error } = await db
        .from("scope_nodes")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
    if (error) {
        console.error("[getScopeNodes]", error.message);
        return [];
    }
    return (data as ScopeNode[]) ?? [];
}

export async function createScopeNode(
    projectId: string,
    title: string,
    nodeType: string,
    parentId?: string | null
) {
    const supabase = await createClient();
    const db = supabase as any;
    const { data, error } = await db
        .from("scope_nodes")
        .insert({
            project_id: projectId,
            parent_id: parentId ?? null,
            title,
            node_type: nodeType,
        })
        .select()
        .single();

    if (error) {
        console.error("[createScopeNode]", error.message);
        return { error: error.message };
    }
    revalidatePath(`/projects/${projectId}`);
    return { success: true, data };
}

export async function updateScopeNode(id: string, title: string, projectId: string) {
    const supabase = await createClient();
    const db = supabase as any;
    const { error } = await db
        .from("scope_nodes")
        .update({ title })
        .eq("id", id);
    if (error) {
        console.error("[updateScopeNode]", error.message);
        return { error: error.message };
    }
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function deleteScopeNode(id: string, projectId: string) {
    const supabase = await createClient();
    const db = supabase as any;
    const { error } = await db
        .from("scope_nodes")
        .delete()
        .eq("id", id);
    if (error) {
        console.error("[deleteScopeNode]", error.message);
        return { error: error.message };
    }
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}
