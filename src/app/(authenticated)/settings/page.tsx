import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: config } = await supabase
    .from("system_config")
    .select("*")
    .order("key");

  return <SettingsClient config={config ?? []} />;
}
