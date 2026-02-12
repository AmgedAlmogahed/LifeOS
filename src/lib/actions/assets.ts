"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProjectAsset(projectId: string, url: string, label: string, type: "github" | "figma" | "supabase" | "docs" | "other") {
    const supabase = await createClient();
    const { error } = await (supabase.from("project_assets") as any).insert({
        project_id: projectId,
        url,
        label,
        asset_type: type
    });
    if (error) throw error;
    revalidatePath(`/projects/${projectId}`);
}

export async function deleteProjectAsset(id: string, projectId: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("project_assets").delete().eq("id", id);
    if (error) throw error;
    revalidatePath(`/projects/${projectId}`);
}

export async function updateClientLogo(clientId: string, url: string) {
    const supabase = await createClient();
    const { error } = await (supabase.from("clients") as any).update({ logo_url: url }).eq("id", clientId);
    if (error) throw error;
    revalidatePath(`/clients/${clientId}`);
}
