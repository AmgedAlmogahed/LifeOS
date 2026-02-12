"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { runAutomator } from "./automator";

export async function createContract(formData: FormData) {
    const supabase = await createClient();
    const title = formData.get("title") as string;
    const client_id = formData.get("client_id") as string;
    if (!title?.trim() || !client_id) return { error: "Title and client are required" };

    const { error } = await (supabase.from("contracts") as any).insert({
        client_id,
        opportunity_id: formData.get("opportunity_id") as string || null,
        price_offer_id: formData.get("price_offer_id") as string || null,
        title: title.trim(),
        status: "Draft",
        pdf_url: (formData.get("pdf_url") as string) ?? "",
        total_value: Number(formData.get("total_value") || 0),
        start_date: formData.get("start_date") as string || null,
        end_date: formData.get("end_date") as string || null,
        terms_md: (formData.get("terms_md") as string) ?? "",
    });

    if (error) return { error: error.message };
    revalidatePath("/vault");
    revalidatePath("/dashboard");
    return { success: true };
}

export async function updateContract(id: string, formData: FormData) {
    const supabase = await createClient();
    const fields: Record<string, unknown> = {};
    for (const [key, val] of formData.entries()) {
        if (val !== "") {
            if (key === "total_value") fields[key] = Number(val);
            else fields[key] = val;
        }
    }

    const newStatus = fields.status as string | undefined;
    const { error } = await (supabase.from("contracts") as any).update(fields).eq("id", id);
    if (error) return { error: error.message };

    // Fire automator: Contract Activated → Audit Log
    if (newStatus === "Active") {
        const { data: contract } = await (supabase.from("contracts") as any).select("*").eq("id", id).single();
        if (contract) await runAutomator("contract_activated", contract);
    }

    revalidatePath("/vault");
    revalidatePath("/dashboard");
    return { success: true };
}
