"use server";

import { createClient } from "@/lib/supabase/server";
import type { BankTransaction, BankTransactionUpdate } from "@/types/database";
import { revalidatePath } from "next/cache";

export async function getBankTransactions(filters?: {
    is_reconciled?: boolean;
    limit?: number;
}): Promise<BankTransaction[]> {
    const supabase = await createClient();
    let query = (supabase.from("bank_transactions" as any) as any)
        .select("*")
        .order("transaction_date", { ascending: false });

    if (filters?.is_reconciled !== undefined) {
        query = query.eq("is_reconciled", filters.is_reconciled);
    }
    query = query.limit(filters?.limit || 100);

    const { data, error } = await query;
    if (error) {
        console.error("[getBankTransactions]", error.message);
        return [];
    }
    return (data || []) as BankTransaction[];
}

export async function createBankTransaction(
    transaction: Partial<Omit<BankTransaction, "id" | "created_at">>
): Promise<BankTransaction> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("bank_transactions" as any) as any)
        .insert(transaction)
        .select()
        .single();

    if (error) throw error;
    revalidatePath("/finance");
    return data as BankTransaction;
}

export async function reconcileTransaction(
    id: string,
    match: { invoice_id?: string; expense_id?: string }
): Promise<void> {
    const supabase = await createClient();
    const update: BankTransactionUpdate = {
        is_reconciled: true,
        reconciled_at: new Date().toISOString(),
    };

    if (match.invoice_id) update.matched_invoice_id = match.invoice_id;
    if (match.expense_id) update.matched_expense_id = match.expense_id;

    const { error } = await (supabase.from("bank_transactions" as any) as any)
        .update(update)
        .eq("id", id);

    if (error) throw error;
    revalidatePath("/finance");
}
