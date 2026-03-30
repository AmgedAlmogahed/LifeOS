import { createClient } from "@/lib/supabase/server";
import { FinanceClient } from "./finance-client";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
    const supabase = await createClient();
    const [invoicesRes, clientsRes, projectsRes] = await Promise.all([
        supabase.from("invoices").select(`
            *,
            clients (name),
            projects (name)
        `).order("created_at", { ascending: false }),
        supabase.from("clients").select("id, name").order("name"),
        supabase.from("projects").select("id, name").order("name"),
    ]);

    const invoices = (invoicesRes.data || []) as any[];
    const totalPaid = invoices.filter(i => i.status === "Paid").reduce((sum, i) => sum + Number(i.amount), 0);
    const totalOutstanding = invoices.filter(i => ["Pending", "Overdue"].includes(i.status)).reduce((sum, i) => sum + Number(i.amount), 0);

    return (
        <FinanceClient
            invoices={invoices}
            clients={(clientsRes.data || []) as any[]}
            projects={(projectsRes.data || []) as any[]}
            stats={{ totalPaid, totalOutstanding }}
        />
    );
}
