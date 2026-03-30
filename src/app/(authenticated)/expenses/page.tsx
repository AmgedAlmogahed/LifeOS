import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ExpensesClient } from "./expenses-client";

export default async function ExpensesPage() {
    const supabase = await createClient();

    // Fetch expenses
    const { data: rawExpenses } = await (supabase.from("expenses" as any) as any)
        .select("*")
        .order("expense_date", { ascending: false })
        .limit(100);

    // Fetch recurring expenses
    const { data: rawRecurring } = await (supabase.from("recurring_expenses" as any) as any)
        .select("*")
        .eq("is_active", true)
        .order("next_due_date", { ascending: true });

    // Fetch projects for dropdown
    const { data: rawProjects } = await supabase.from("projects")
        .select("id, name")
        .order("name");

    const expenses = (rawExpenses || []) as any[];
    const recurringExpenses = (rawRecurring || []) as any[];
    const projects = (rawProjects || []) as { id: string; name: string }[];

    // Summary calculations
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    const thisMonthExpenses = expenses.filter(
        (e: any) => e.expense_date >= monthStart && e.expense_date <= monthEnd
    );

    const totalThisMonth = thisMonthExpenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
    const totalVatThisMonth = thisMonthExpenses.reduce((sum: number, e: any) => sum + Number(e.vat_amount || 0), 0);
    const recurringMonthly = recurringExpenses
        .filter((r: any) => r.frequency === "monthly")
        .reduce((sum: number, r: any) => sum + Number(r.amount), 0);

    // Category breakdown
    const byCategory: Record<string, number> = {};
    for (const e of thisMonthExpenses) {
        byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
    }

    return (
        <ExpensesClient
            expenses={expenses}
            recurringExpenses={recurringExpenses}
            projects={projects}
            totalThisMonth={totalThisMonth}
            totalVatThisMonth={totalVatThisMonth}
            recurringMonthly={recurringMonthly}
            byCategory={byCategory}
        />
    );
}
