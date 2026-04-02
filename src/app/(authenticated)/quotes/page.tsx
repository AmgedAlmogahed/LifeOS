import { createClient } from "@/lib/supabase/server";
import { QuotesClient } from "./quotes-client";
import { redirect } from "next/navigation";

export const metadata = { title: "Quotations | Venture OS" };

export default async function QuotesPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/auth/login");

  const { data: accounts } = await supabase.from("accounts").select("*").eq("is_active", true);

  let quotes: any[] = [];
  try {
    const { data: qts, error: err } = await supabase.from("price_offers").select("*, clients(name)").order("created_at", { ascending: false });
    if (!err && qts) quotes = qts;
  } catch (err) {
    console.warn("Could not fetch quotes data, migration possibly unapplied");
  }

  return (
    <QuotesClient 
      accounts={accounts || []} 
      quotes={quotes} 
    />
  );
}
