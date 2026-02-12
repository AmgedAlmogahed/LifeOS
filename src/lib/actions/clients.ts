"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createClientAction(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get("name") as string;
    if (!name?.trim()) return { error: "Name is required" };

    const { error } = await (supabase.from("clients") as any).insert({
        name: name.trim(),
        email: (formData.get("email") as string) ?? "",
        phone: (formData.get("phone") as string) ?? "",
        brand_primary: (formData.get("brand_primary") as string) || "#6366f1",
        brand_secondary: (formData.get("brand_secondary") as string) || "#8b5cf6",
        brand_accent: (formData.get("brand_accent") as string) || "#06b6d4",
        logo_url: (formData.get("logo_url") as string) ?? "",
        brand_assets_url: (formData.get("brand_assets_url") as string) ?? "",
        notes: (formData.get("notes") as string) ?? "",
        health_score: 100,
        is_active: true,
    });

    if (error) return { error: error.message };
    revalidatePath("/clients");
    revalidatePath("/dashboard");
    return { success: true };
}

export async function updateClientAction(id: string, formData: FormData) {
    const supabase = await createClient();
    const fields: Record<string, unknown> = {};
    for (const [key, val] of formData.entries()) {
        if (key.endsWith("_hex")) continue; // skip color hex mirrors
        if (val !== "") fields[key] = val;
    }
    const { error } = await (supabase.from("clients") as any).update(fields).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/clients");
    revalidatePath(`/clients/${id}`);
    revalidatePath("/dashboard");
    return { success: true };
}

export async function deleteClientAction(id: string) {
    const supabase = await createClient();
    const { error } = await (supabase.from("clients") as any).delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/clients");
    revalidatePath("/dashboard");
    return { success: true };
}
