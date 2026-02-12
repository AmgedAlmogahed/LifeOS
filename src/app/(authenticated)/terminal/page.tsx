import { createClient } from "@/lib/supabase/server";
import { AgentTerminal } from "./terminal-client";

export const dynamic = "force-dynamic";

export default async function TerminalRoute() {
  const supabase = await createClient();
  const [reportsRes, logsRes, clientsRes, projectsRes] = await Promise.all([
    supabase.from("agent_reports").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("audit_logs").select("*").order("timestamp", { ascending: false }).limit(50),
    supabase.from("clients").select("id, name"),
    supabase.from("projects").select("id, name"),
  ]);
  return (
    <AgentTerminal
      reports={(reportsRes.data ?? []) as any[]}
      auditLogs={(logsRes.data ?? []) as any[]}
      clients={(clientsRes.data ?? []) as any[]}
      projects={(projectsRes.data ?? []) as any[]}
    />
  );
}
