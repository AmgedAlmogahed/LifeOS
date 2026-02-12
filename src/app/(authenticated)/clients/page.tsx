import { createClient } from "@/lib/supabase/server";
import { ClientsList } from "./clients-client";

export const dynamic = "force-dynamic";

export default async function ClientsRoute() {
  const supabase = await createClient();
  const { data } = await supabase.from("clients").select("*").order("name", { ascending: true });
  return <ClientsList clients={(data ?? []) as any[]} />;
}
