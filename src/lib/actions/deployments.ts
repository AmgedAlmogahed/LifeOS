"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createDeployment(formData: FormData) {
    const supabase = await createClient();
    const label = formData.get("label") as string;
    const project_id = formData.get("project_id") as string;
    if (!label?.trim() || !project_id) return { error: "Label and project are required" };

    const { error } = await (supabase.from("deployments") as any).insert({
        project_id,
        client_id: formData.get("client_id") as string || null,
        environment: (formData.get("environment") as string) || "Vercel",
        label: label.trim(),
        url: (formData.get("url") as string) ?? "",
        status: "healthy",
        last_checked_at: new Date().toISOString(),
        metadata: {},
    });

    if (error) return { error: error.message };
    revalidatePath("/deployments");
    revalidatePath("/dashboard");
    return { success: true };
}

export async function updateDeployment(id: string, formData: FormData) {
    const supabase = await createClient();
    const fields: Record<string, unknown> = {};
    for (const [key, val] of formData.entries()) {
        if (val !== "") fields[key] = val;
    }
    fields.last_checked_at = new Date().toISOString();
    const { error } = await (supabase.from("deployments") as any).update(fields).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/deployments");
    revalidatePath("/dashboard");
    return { success: true };
}

export async function deleteDeployment(id: string) {
    const supabase = await createClient();
    const { error } = await (supabase.from("deployments") as any).delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/deployments");
    revalidatePath("/dashboard");
    return { success: true };
}
