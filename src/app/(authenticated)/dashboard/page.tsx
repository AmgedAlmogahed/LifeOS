import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [projectsRes, logsRes, tasksRes, configRes] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false }),
    supabase
      .from("audit_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(50),
    supabase.from("tasks").select("*"),
    supabase.from("system_config").select("*"),
  ]);

  return (
    <DashboardClient
      projects={projectsRes.data ?? []}
      logs={logsRes.data ?? []}
      tasks={tasksRes.data ?? []}
      config={configRes.data ?? []}
    />
  );
}
