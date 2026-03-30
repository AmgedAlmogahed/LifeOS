"use server";

import { createClient } from "@/lib/supabase/server";
import type { ProjectStateContext, ProjectStateContextUpdate } from "@/types/database";
import { revalidatePath } from "next/cache";

export async function getProjectStateContext(projectId: string): Promise<ProjectStateContext | null> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("project_state_context" as any) as any)
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();

    if (error) {
        console.error("[getProjectStateContext]", error.message);
        return null;
    }
    return data as ProjectStateContext | null;
}

export async function upsertProjectStateContext(
    projectId: string,
    update: ProjectStateContextUpdate
): Promise<ProjectStateContext | null> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("project_state_context" as any) as any)
        .upsert(
            {
                project_id: projectId,
                ...update,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "project_id" }
        )
        .select()
        .single();

    if (error) throw error;
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/cockpit");
    return data as ProjectStateContext;
}
