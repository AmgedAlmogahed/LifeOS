import { createClient } from "@/lib/supabase/server";
import { LogsClient } from "./logs-client";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(200);

  return <LogsClient logs={logs ?? []} />;
}
