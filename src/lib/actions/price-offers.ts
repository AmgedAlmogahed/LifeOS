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

    const paymentScheduleRaw = formData.get("payment_schedule") as string;
    let payment_schedule = [];
    try { payment_schedule = JSON.parse(paymentScheduleRaw || "[]"); } catch { /* empty */ }

    const total_value = (items as any[]).reduce((s, i) => s + (Number(i.total) || 0), 0);

    const { data: insertedOffer, error } = await (supabase.from("price_offers") as any).insert({
        client_id,
        account_id: formData.get("account_id") as string || null,
        opportunity_id: formData.get("opportunity_id") as string || null,
        title: title.trim(),
        items,
        total_value,
        vat_type: (formData.get("vat_type") as string) || "15%",
        discount_amount: Number(formData.get("discount_amount") || 0),
        payment_schedule,
        status: "Draft",
        valid_until: formData.get("valid_until") as string || null,
        pdf_url: formData.get("pdf_url") as string || null,
        sent_date: formData.get("sent_date") as string || null,
        notes: (formData.get("notes") as string) ?? "",
        version: Number(formData.get("version") || 1),
    }).select().single();

    if (error) return { error: error.message };

    // Insert into quote_line_items
    if (insertedOffer && items.length > 0) {
        const lineItems = (items as any[]).map(item => ({
            quote_id: insertedOffer.id,
            service_name: item.name || "Untitled Service",
            service_category: item.service_category || item.service_type || null,
            unit_price: Number(item.unit_price) || 0,
            quantity: Number(item.quantity) || 1,
            total_price: Number(item.total) || 0,
            creates_project: item.creates_project === true || item.creates_project === "true"
        }));
        await (supabase.from("quote_line_items") as any).insert(lineItems);
    }

    // Advance pipeline to quote_draft if tracker_id is provided
    const tracker_id = formData.get("tracker_id") as string;
    if (tracker_id) {
        await supabase.rpc('advance_pipeline', {
            p_tracker_id: tracker_id,
            p_new_stage: 'quote_draft'
        });
        // Also update tracker with the quote_id
        await (supabase.from('pipeline_tracker') as any).update({ quote_id: insertedOffer.id }).eq('id', tracker_id);
    }

    revalidatePath("/quotes");
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

    revalidatePath("/quotes");
    revalidatePath("/dashboard");
    return { success: true };
}

export async function markQuoteWon(quoteId: string, trackerId?: string) {
    const supabase = await createClient();
    
    // 1. Update quote status 
    const { error } = await (supabase.from("price_offers") as any).update({ status: "Accepted" }).eq("id", quoteId);
    if (error) return { error: error.message };

    // 2. Create projects from quote line items
    const { data: result, error: rpcError } = await supabase.rpc('create_projects_from_quote', {
        p_quote_id: quoteId
    });

    if (rpcError) return { error: rpcError.message };

    // 3. Advance pipeline if applicable
    if (trackerId) {
        await supabase.rpc('advance_pipeline', {
            p_tracker_id: trackerId,
            p_new_stage: 'quote_won'
        });
    }

    revalidatePath("/quotes");
    revalidatePath("/projects");
    revalidatePath("/dashboard");
    return { success: true, result };
}
