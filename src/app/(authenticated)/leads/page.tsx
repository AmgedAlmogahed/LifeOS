import { createClient } from "@/lib/supabase/server";
import { LeadsClient } from "./leads-client";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const supabase = await createClient();
  const [leadsRes, clientsRes, accountsRes] = await Promise.all([
    (supabase.from("leads" as any) as any)
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("id, name").order("name"),
    (supabase.from("accounts" as any) as any).select("id, name"),
  ]);

  return (
    <LeadsClient
      leads={(leadsRes.data ?? []) as any[]}
      clients={(clientsRes.data ?? []) as any[]}
      accounts={(accountsRes.data ?? []) as any[]}
    />
  );
}
