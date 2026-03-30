import { createClient } from "@/lib/supabase/server";
import { QuotesClient } from "./quotes-client";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const supabase = await createClient();
  const [offersRes, clientsRes, oppsRes] = await Promise.all([
    supabase.from("price_offers").select("*").order("created_at", { ascending: false }),
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("opportunities").select("id, title, client_id").order("updated_at", { ascending: false }),
  ]);

  return (
    <QuotesClient
      offers={(offersRes.data ?? []) as any[]}
      clients={(clientsRes.data ?? []) as any[]}
      opportunities={(oppsRes.data ?? []) as any[]}
    />
  );
}
