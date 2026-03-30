"use server";

import { createClient } from "@/lib/supabase/server";
import type { TaxRecord, TaxRecordUpdate } from "@/types/database";
import { revalidatePath } from "next/cache";

export async function getTaxRecords(): Promise<TaxRecord[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("tax_records" as any) as any)
        .select("*")
        .order("period_start", { ascending: false });

    if (error) {
        console.error("[getTaxRecords]", error.message);
        return [];
    }
    return (data || []) as TaxRecord[];
}

export async function createTaxRecord(
    record: Partial<Omit<TaxRecord, "id" | "created_at" | "updated_at">>
): Promise<TaxRecord> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("tax_records" as any) as any)
        .insert(record)
        .select()
        .single();

    if (error) throw error;
    revalidatePath("/finance");
    return data as TaxRecord;
}

export async function updateTaxRecord(id: string, update: TaxRecordUpdate): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.from("tax_records" as any) as any)
        .update({ ...update, updated_at: new Date().toISOString() })
        .eq("id", id);

    if (error) throw error;
    revalidatePath("/finance");
}
