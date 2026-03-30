import { createClient } from "@/lib/supabase/server";
import { ContractsClient } from "./contracts-client";

export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  const supabase = await createClient();
  const [contractsRes, clientsRes] = await Promise.all([
    supabase.from("contracts").select("*").order("created_at", { ascending: false }),
    supabase.from("clients").select("id, name").order("name"),
  ]);

  return (
    <ContractsClient
      contracts={(contractsRes.data ?? []) as any[]}
      clients={(clientsRes.data ?? []) as any[]}
    />
  );
}
