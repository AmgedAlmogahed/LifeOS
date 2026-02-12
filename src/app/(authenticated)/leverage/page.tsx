import { createClient } from "@/lib/supabase/server";
import { LeveragePage } from "./leverage-client";

export const dynamic = "force-dynamic";

export default async function LeverageRoute() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leverage_logs")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(200);
  return <LeveragePage logs={(data ?? []) as any[]} />;
}
