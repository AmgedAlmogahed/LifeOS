import { createClient } from "@/lib/supabase/server";
import { FinanceDashboardClient } from "./finance-dashboard-client";
import { redirect } from "next/navigation";

export const metadata = { title: "Finance Overview | Venture OS" };

export default async function FinancePage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/auth/login");

  // Fetch accounts to build the multi-company switcher if needed
  const { data: accounts } = await supabase.from("accounts").select("*").eq("is_active", true);

  // Safely attempt to fetch invoices and expenses, falling back to mock if migration is unapplied
  let invoices = [];
  let expenses = [];
  
  try {
    const { data: invs, error: invsErr } = await supabase.from("invoices").select("*, clients(name), projects(name)").order("created_at", { ascending: false });
    if (!invsErr && invs) invoices = invs;
    
    const { data: exps, error: expsErr } = await supabase.from("expenses").select("*").order("expense_date", { ascending: false });
    if (!expsErr && exps) expenses = exps;
  } catch (err) {
    console.warn("Could not fetch finance data, migration possibly unapplied");
  }

  return (
    <FinanceDashboardClient 
      accounts={accounts || []} 
      invoices={invoices} 
      expenses={expenses} 
    />
  );
}
