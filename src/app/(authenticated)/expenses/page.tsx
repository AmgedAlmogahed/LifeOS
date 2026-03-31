import { createClient } from "@/lib/supabase/server";
import { ExpensesClient } from "./expenses-client";
import { redirect } from "next/navigation";

export const metadata = { title: "Expense Tracker | Venture OS" };

export default async function ExpensesPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/auth/login");

  const { data: accounts } = await supabase.from("accounts").select("*").eq("is_active", true);

  let expenses = [];
  try {
    const { data: exps, error: expsErr } = await supabase.from("expenses").select("*, accounts(name)").order("expense_date", { ascending: false });
    if (!expsErr && exps) expenses = exps;
  } catch (err) {
    console.warn("Could not fetch expenses data, migration possibly unapplied");
  }

  return (
    <ExpensesClient 
      accounts={accounts || []} 
      expenses={expenses} 
    />
  );
}
