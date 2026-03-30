import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const [accountsRes, secretsRes, rulesRes, catalogRes] = await Promise.all([
    (supabase.from("accounts" as any) as any).select("*").order("name"),
    supabase.from("vault_secrets").select("*").order("created_at", { ascending: false }),
    (supabase.from("guardian_rules" as any) as any).select("*").order("created_at", { ascending: false }),
    (supabase.from("service_catalog" as any) as any).select("*").order("name"),
  ]);

  return (
    <SettingsClient
      accounts={(accountsRes.data ?? []) as any[]}
      secrets={(secretsRes.data ?? []) as any[]}
      rules={(rulesRes.data ?? []) as any[]}
      services={(catalogRes.data ?? []) as any[]}
    />
  );
}
