"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { runAutomator } from "./automator";

export async function createPriceOffer(formData: FormData) {
    const supabase = await createClient();
    const title = formData.get("title") as string;
    const client_id = formData.get("client_id") as string;
    if (!title?.trim() || !client_id) return { error: "Title and client are required" };

    const itemsRaw = formData.get("items") as string;
    let items: unknown[] = [];
    try { items = JSON.parse(itemsRaw || "[]"); } catch { /* empty */ }

    const total_value = (items as any[]).reduce((s, i) => s + (Number(i.total) || 0), 0);

    const { error } = await (supabase.from("price_offers") as any).insert({
        client_id,
        opportunity_id: formData.get("opportunity_id") as string || null,
        title: title.trim(),
        items,
        total_value,
        status: "Draft",
        valid_until: formData.get("valid_until") as string || null,
        notes: (formData.get("notes") as string) ?? "",
    });

    if (error) return { error: error.message };
    revalidatePath("/vault");
    revalidatePath("/dashboard");
    return { success: true };
}

export async function updatePriceOffer(id: string, formData: FormData) {
    const supabase = await createClient();
    const fields: Record<string, unknown> = {};
    for (const [key, val] of formData.entries()) {
        if (key === "items") { try { fields.items = JSON.parse(val as string); } catch { /* skip */ } continue; }
        if (val !== "") {
            if (key === "total_value") fields[key] = Number(val);
            else fields[key] = val;
        }
    }

    const newStatus = fields.status as string | undefined;
    const { error } = await (supabase.from("price_offers") as any).update(fields).eq("id", id);
    if (error) return { error: error.message };

    // Fire automator: Offer Accepted → Draft Contract
    if (newStatus === "Accepted") {
        const { data: offer } = await (supabase.from("price_offers") as any).select("*").eq("id", id).single();
        if (offer) await runAutomator("offer_accepted", offer);
    }

    revalidatePath("/vault");
    revalidatePath("/dashboard");
    return { success: true };
}
