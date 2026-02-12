"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { runAutomator } from "./automator";

export async function createOpportunity(formData: FormData) {
    const supabase = await createClient();
    const title = formData.get("title") as string;
    const client_id = formData.get("client_id") as string;
    if (!title?.trim() || !client_id) return { error: "Title and client are required" };

    const { data, error } = await (supabase.from("opportunities") as any).insert({
        client_id,
        title: title.trim(),
        description: (formData.get("description") as string) ?? "",
        service_type: (formData.get("service_type") as string) || "Web",
        stage: "Draft",
        estimated_value: Number(formData.get("estimated_value") || 0),
        probability: Number(formData.get("probability") || 25),
        expected_close: formData.get("expected_close") as string || null,
        won_at: null,
        lost_reason: "",
    }).select().single();

    if (error) return { error: error.message };
    revalidatePath("/pipeline");
    revalidatePath("/dashboard");
    return { success: true, id: data?.id };
}

export async function updateOpportunity(id: string, formData: FormData) {
    const supabase = await createClient();
    const fields: Record<string, unknown> = {};
    for (const [key, val] of formData.entries()) {
        if (val !== "") {
            if (["estimated_value", "probability"].includes(key)) fields[key] = Number(val);
            else fields[key] = val;
        }
    }

    // Check for stage transition to "Won"
    const newStage = fields.stage as string | undefined;

    if (newStage === "Won") fields.won_at = new Date().toISOString();

    const { error } = await (supabase.from("opportunities") as any).update(fields).eq("id", id);
    if (error) return { error: error.message };

    // Fire automator if Won
    if (newStage === "Won") {
        const { data: opp } = await (supabase.from("opportunities") as any).select("*").eq("id", id).single();
        if (opp) await runAutomator("opportunity_won", opp);
    }

    revalidatePath("/pipeline");
    revalidatePath("/dashboard");
    return { success: true };
}

export async function deleteOpportunity(id: string) {
    const supabase = await createClient();
    const { error } = await (supabase.from("opportunities") as any).delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/pipeline");
    revalidatePath("/dashboard");
    return { success: true };
}
