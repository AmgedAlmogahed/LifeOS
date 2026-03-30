import { createClient } from "@/lib/supabase/server";
import { AgentsClient } from "./agents-client";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const supabase = await createClient();
  const [reportsRes, logsRes, clientsRes, projectsRes, delegationsRes] = await Promise.all([
    supabase.from("agent_reports").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("audit_logs").select("*").order("timestamp", { ascending: false }).limit(50),
    supabase.from("clients").select("id, name"),
    supabase.from("projects").select("id, name"),
    (supabase.from("delegation_log" as any) as any)
      .select("*, tasks(title, status, project_id)")
      .order("delegated_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <AgentsClient
      reports={(reportsRes.data ?? []) as any[]}
      auditLogs={(logsRes.data ?? []) as any[]}
      clients={(clientsRes.data ?? []) as any[]}
      projects={(projectsRes.data ?? []) as any[]}
      delegations={(delegationsRes.data ?? []) as any[]}
    />
  );
}
