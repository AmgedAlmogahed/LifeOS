import { formatCurrency, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export default async function FinancePage() {
    const supabase = await createClient();
    const { data: rawInvoices } = await supabase.from("invoices").select(`
        *,
        clients (name),
        projects (name)
    `).order("created_at", { ascending: false });

    // Using any cast because join types are tricky without full generation
    const invoices = (rawInvoices || []) as any[];

    const totalPaid = invoices.filter(i => i.status === "Paid").reduce((sum, i) => sum + Number(i.amount), 0);
    const totalOutstanding = invoices.filter(i => ["Pending", "Overdue"].includes(i.status)).reduce((sum, i) => sum + Number(i.amount), 0);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Financial Overview</h1>
        
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                     <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Total Revenue (Paid)</h3>
                     <div className="text-2xl font-bold mt-2 text-emerald-500">{formatCurrency(totalPaid)}</div>
                </div>
                 <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                     <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Outstanding (Pending)</h3>
                     <div className="text-2xl font-bold mt-2 text-amber-500">{formatCurrency(totalOutstanding)}</div>
                </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow">
                <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">Invoices</h3>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b border-border">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">ID</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Client</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Project</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Due Date</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0 border-border">
                                {invoices.map((inv) => (
                                    <tr key={inv.id} className="border-b transition-colors hover:bg-muted/50 border-border">
                                        <td className="p-4 align-middle font-mono text-xs text-muted-foreground">{inv.id.slice(0,8)}</td>
                                        <td className="p-4 align-middle font-medium text-foreground">{inv.clients?.name || "-"}</td>
                                        <td className="p-4 align-middle text-muted-foreground">{inv.projects?.name || "-"}</td>
                                        <td className="p-4 align-middle font-mono text-foreground">{formatCurrency(inv.amount)}</td>
                                        <td className="p-4 align-middle">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold
                                                ${inv.status === "Paid" ? "bg-emerald-500/10 text-emerald-500" : 
                                                  inv.status === "Overdue" ? "bg-red-500/10 text-red-500" :
                                                  inv.status === "Pending" ? "bg-amber-500/10 text-amber-500" : 
                                                  "bg-muted text-muted-foreground"}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle text-muted-foreground">{formatDate(inv.due_date)}</td>
                                    </tr>
                                ))}
                                {invoices.length === 0 && (
                                     <tr>
                                        <td colSpan={6} className="p-4 text-center text-muted-foreground">No invoices found.</td>
                                     </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
