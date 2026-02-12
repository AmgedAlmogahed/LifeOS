"use server";

import { createClient } from "@/lib/supabase/server";
import { InvoiceInsert, InvoiceUpdate, PaymentInsert } from "@/types/database";
import { revalidatePath } from "next/cache";

export async function createInvoice(invoice: InvoiceInsert) {
    const supabase = await createClient();
    const { data, error } = await supabase.from("invoices").insert(invoice).select().single();
    if (error) throw error;
    revalidatePath("/finance");
    return data;
}

export async function createInvoiceFromPriceOffer(offerId: string) {
    const supabase = await createClient();

    // 1. Fetch Offer
    const { data: offer, error: offerError } = await supabase
        .from("price_offers")
        .select("*")
        .eq("id", offerId)
        .single();

    if (offerError || !offer) throw new Error("Price Offer not found");

    // 2. Fetch Project (optional, linking if exists)
    // Often offers are linked to opportunities, which might have a project.
    // For now, we'll try to find a project via opportunity if not direct.
    let projectId = null;
    if (offer.opportunity_id) {
        // Try to find project linked to this opportunity or contract?
        // Simpler: Just use client_id and amount for now.
        // If there's a project linked to the opportunity, we could use it?
        // Table `projects` doesn't link to `opportunity`.
        // But `contracts` link to `price_offer`.
        // Let's check if there is a contract for this offer.
        const { data: contract } = await supabase
            .from("contracts")
            .select("id")
            .eq("price_offer_id", offerId)
            .single();

        if (contract) {
            const { data: proj } = await supabase.from("projects").select("id").eq("contract_id", contract.id).single();
            if (proj) projectId = proj.id;
        }
    }

    const { data: invoice, error } = await supabase.from("invoices").insert({
        client_id: offer.client_id,
        project_id: projectId, // null if not found
        amount: offer.total_value,
        status: "Pending",
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
        pdf_url: null, // to be generated
    }).select().single();

    if (error) throw error;
    revalidatePath("/finance");
    return invoice;
}

export async function updateInvoice(id: string, update: InvoiceUpdate) {
    const supabase = await createClient();
    const { error } = await supabase.from("invoices").update(update).eq("id", id);
    if (error) throw error;
    revalidatePath("/finance");
}

export async function recordPayment(payment: PaymentInsert) {
    const supabase = await createClient();

    // 1. Insert Payment
    const { error } = await supabase.from("payments").insert(payment);
    if (error) throw error;

    // 2. Check totals
    const { data: payments } = await supabase.from("payments").select("amount").eq("invoice_id", payment.invoice_id);
    const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    const { data: invoice } = await supabase.from("invoices").select("amount").eq("id", payment.invoice_id).single();
    if (invoice && totalPaid >= Number(invoice.amount)) {
        await supabase.from("invoices").update({ status: "Paid" }).eq("id", payment.invoice_id);
    }

    revalidatePath("/finance");
}
