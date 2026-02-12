import { createClient } from "@/lib/supabase/server";
import { VaultDashboard } from "./vault-client";

export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const supabase = await createClient();
  const [offersRes, contractsRes, clientsRes, secretsRes, oppsRes] = await Promise.all([
    supabase.from("price_offers").select("*").order("created_at", { ascending: false }),
    supabase.from("contracts").select("*").order("created_at", { ascending: false }),
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("vault_secrets").select("*").order("created_at", { ascending: false }),
    supabase.from("opportunities").select("id, title, client_id").order("updated_at", { ascending: false }),
  ]);

  return (
    <VaultDashboard
      offers={(offersRes.data ?? []) as any[]}
      contracts={(contractsRes.data ?? []) as any[]}
      clients={(clientsRes.data ?? []) as any[]}
      secrets={(secretsRes.data ?? []) as any[]}
      opportunities={(oppsRes.data ?? []) as any[]}
    />
  );
}
