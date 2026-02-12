import { createClient } from "@/lib/supabase/server";
import { CommandHub } from "./command-hub";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [clientsRes, oppsRes, contractsRes, projectsRes, deploymentsRes, reportsRes, leverageRes, tasksRes] =
    await Promise.all([
      supabase.from("clients").select("*").order("updated_at", { ascending: false }),
      supabase.from("opportunities").select("*").order("updated_at", { ascending: false }),
      supabase.from("contracts").select("*").order("created_at", { ascending: false }),
      supabase.from("projects").select("*").order("updated_at", { ascending: false }),
      supabase.from("deployments").select("*").order("created_at", { ascending: false }),
      supabase.from("agent_reports").select("*").order("created_at", { ascending: false }).limit(10),
      supabase.from("leverage_logs").select("*").order("timestamp", { ascending: false }).limit(100),
      (supabase.from("tasks") as any).select("*").order("due_date", { ascending: true }),
    ]);

  return (
    <CommandHub
      clients={(clientsRes.data ?? []) as any[]}
      opportunities={(oppsRes.data ?? []) as any[]}
      contracts={(contractsRes.data ?? []) as any[]}
      projects={(projectsRes.data ?? []) as any[]}
      deployments={(deploymentsRes.data ?? []) as any[]}
      agentReports={(reportsRes.data ?? []) as any[]}
      leverageLogs={(leverageRes.data ?? []) as any[]}
      tasks={(tasksRes.data ?? []) as any[]}
    />
  );
}
