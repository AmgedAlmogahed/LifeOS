"use server";

import { createClient } from "@/lib/supabase/server";
import type { Expense, ExpenseInsert, ExpenseUpdate, RecurringExpense, RecurringExpenseInsert, RecurringExpenseUpdate } from "@/types/database";
import { revalidatePath } from "next/cache";

// ─── Expenses ──────────────────────────────────────────────────────────────

export async function getExpenses(filters?: {
    category?: string;
    date_from?: string;
    date_to?: string;
    project_id?: string;
}): Promise<Expense[]> {
    const supabase = await createClient();
    let query = (supabase.from("expenses" as any) as any)
        .select("*")
        .order("expense_date", { ascending: false });

    if (filters?.category) query = query.eq("category", filters.category);
    if (filters?.date_from) query = query.gte("expense_date", filters.date_from);
    if (filters?.date_to) query = query.lte("expense_date", filters.date_to);
    if (filters?.project_id) query = query.eq("project_id", filters.project_id);

    const { data, error } = await query;
    if (error) {
        console.error("[getExpenses]", error.message);
        return [];
    }
    return (data || []) as Expense[];
}

export async function createExpense(expense: Partial<ExpenseInsert>): Promise<Expense> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("expenses" as any) as any)
        .insert(expense)
        .select()
        .single();

    if (error) throw error;
    revalidatePath("/expenses");
    revalidatePath("/finance");
    return data as Expense;
}

export async function updateExpense(id: string, update: ExpenseUpdate): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.from("expenses" as any) as any)
        .update({ ...update, updated_at: new Date().toISOString() })
        .eq("id", id);

    if (error) throw error;
    revalidatePath("/expenses");
    revalidatePath("/finance");
}

export async function deleteExpense(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.from("expenses" as any) as any)
        .delete()
        .eq("id", id);

    if (error) throw error;
    revalidatePath("/expenses");
    revalidatePath("/finance");
}

// ─── Recurring Expenses ────────────────────────────────────────────────────

export async function getRecurringExpenses(activeOnly = true): Promise<RecurringExpense[]> {
    const supabase = await createClient();
    let query = (supabase.from("recurring_expenses" as any) as any)
        .select("*")
        .order("next_due_date", { ascending: true });

    if (activeOnly) query = query.eq("is_active", true);

    const { data, error } = await query;
    if (error) {
        console.error("[getRecurringExpenses]", error.message);
        return [];
    }
    return (data || []) as RecurringExpense[];
}

export async function createRecurringExpense(expense: Partial<RecurringExpenseInsert>): Promise<RecurringExpense> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("recurring_expenses" as any) as any)
        .insert(expense)
        .select()
        .single();

    if (error) throw error;
    revalidatePath("/expenses");
    return data as RecurringExpense;
}

export async function updateRecurringExpense(id: string, update: RecurringExpenseUpdate): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase.from("recurring_expenses" as any) as any)
        .update({ ...update, updated_at: new Date().toISOString() })
        .eq("id", id);

    if (error) throw error;
    revalidatePath("/expenses");
}

// ─── Expense Summary ──────────────────────────────────────────────────────

export async function getExpenseSummary(periodStart: string, periodEnd: string): Promise<{
    total: number;
    totalVat: number;
    byCategory: Record<string, { amount: number; vat: number; count: number }>;
}> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("expenses" as any) as any)
        .select("amount, vat_amount, category")
        .gte("expense_date", periodStart)
        .lte("expense_date", periodEnd);

    if (error || !data) {
        return { total: 0, totalVat: 0, byCategory: {} };
    }

    const expenses = data as Array<{ amount: number; vat_amount: number; category: string }>;
    const byCategory: Record<string, { amount: number; vat: number; count: number }> = {};
    let total = 0;
    let totalVat = 0;

    for (const e of expenses) {
        total += Number(e.amount);
        totalVat += Number(e.vat_amount);
        if (!byCategory[e.category]) {
            byCategory[e.category] = { amount: 0, vat: 0, count: 0 };
        }
        byCategory[e.category].amount += Number(e.amount);
        byCategory[e.category].vat += Number(e.vat_amount);
        byCategory[e.category].count += 1;
    }

    return { total, totalVat, byCategory };
}
