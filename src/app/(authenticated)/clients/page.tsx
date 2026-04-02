import { createClient } from "@/lib/supabase/server";
import { ClientsList } from "./clients-client";

export const dynamic = "force-dynamic";

export default async function ClientsRoute() {
  const supabase = await createClient();
  const [clientsRes, accountsRes] = await Promise.all([
    supabase.from("clients").select("*, accounts(name, primary_color)").order("name", { ascending: true }),
    supabase.from("accounts").select("id, name, primary_color")
  ]);

  return (
    <ClientsList 
      initialClients={(clientsRes.data ?? []) as any[]} 
      accounts={(accountsRes.data ?? []) as any[]}
    />
  );
}
