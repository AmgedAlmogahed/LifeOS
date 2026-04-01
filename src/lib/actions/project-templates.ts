"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProjectTemplate } from "@/types/database";

export async function getProjectTemplates(): Promise<ProjectTemplate[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("project_templates" as any) as any).select("*").order("name");
    if (error) {
        console.error("[getProjectTemplates]", error.message);
        return [];
    }
    return data;
}

export async function getProjectTemplateByCategory(category: string): Promise<ProjectTemplate | null> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("project_templates" as any) as any)
        .select("*")
        .eq("category", category)
        .eq("is_active", true)
        .maybeSingle();

    if (error) {
        console.error("[getProjectTemplateByCategory]", error.message);
        return null;
    }
    return data;
}

export async function upsertProjectTemplate(
    template: Partial<ProjectTemplate> & { category: string; name: string }
): Promise<ProjectTemplate> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("project_templates" as any) as any)
        .upsert(
            {
                ...template,
                updated_at: new Date().toISOString()
            },
            { onConflict: "category" }
        )
        .select()
        .single();

    if (error) throw error;
    revalidatePath("/settings");
    return data;
}
