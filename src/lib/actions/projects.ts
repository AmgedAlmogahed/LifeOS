"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createProject(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get("name") as string;
    if (!name?.trim()) return { error: "Name is required" };

    const { data, error } = await (supabase.from("projects") as any).insert({
        name: name.trim(),
        description: (formData.get("description") as string) ?? "",
        status: "Understand",
        progress: 0,
        is_frozen: false,
        specs_md: (formData.get("specs_md") as string) ?? "",
        client_id: formData.get("client_id") as string || null,
        contract_id: formData.get("contract_id") as string || null,
        service_type: formData.get("service_type") as string || null,
    }).select().single();

    if (error) return { error: error.message };

    // Auto-create lifecycle record
    if (data) {
        await (supabase.from("lifecycles") as any).insert({
            project_id: data.id,
            current_stage: "Requirements",
            stage_history: [{ stage: "Requirements", entered_at: new Date().toISOString() }],
            started_at: new Date().toISOString(),
        });
    }

    revalidatePath("/forge");
    revalidatePath("/dashboard");
    return { success: true, id: data?.id };
}

export async function updateProject(id: string, formData: FormData) {
    const supabase = await createClient();
    const fields: Record<string, unknown> = {};
    for (const [key, val] of formData.entries()) {
        if (val !== "") {
            if (key === "progress") fields[key] = Number(val);
            else if (key === "is_frozen") fields[key] = val === "true";
            else fields[key] = val;
        }
    }
    const { error } = await (supabase.from("projects") as any).update(fields).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/forge");
    revalidatePath(`/forge/${id}`);
    revalidatePath("/dashboard");
    return { success: true };
}

export async function deleteProject(id: string) {
    const supabase = await createClient();
    const { error } = await (supabase.from("projects") as any).delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/forge");
    revalidatePath("/dashboard");
    return { success: true };
}
