import { createClient } from "@/lib/supabase/server";
import { TasksClient } from "./tasks-client";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const supabase = await createClient();

  const [tasksRes, projectsRes, sprintsRes, modulesRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .neq("status", "Cancelled")
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("projects")
      .select("id, name, status, category"),
    supabase
      .from("sprints")
      .select("id, project_id, sprint_number, goal, status, planned_end_at")
      .eq("status", "active"),
    supabase
      .from("modules")
      .select("id, name, project_id"),
  ]);

  return (
    <TasksClient
      tasks={tasksRes.data ?? []}
      projects={projectsRes.data ?? []}
      activeSprints={sprintsRes.data ?? []}
      modules={modulesRes.data ?? []}
    />
  );
}
