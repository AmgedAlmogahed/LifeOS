import { createClient } from "@/lib/supabase/server";
import { CalendarClient } from "./calendar-client";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const supabase = await createClient();

  const [tasksRes, projectsRes, sprintsRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .neq("status", "Cancelled"),
    supabase
      .from("projects")
      .select("id, name, status, category"),
    supabase
      .from("sprints")
      .select("id, project_id, sprint_number, goal, status, started_at, planned_end_at")
      .in("status", ["active", "completed"])
      .order("started_at", { ascending: true }),
  ]);

  return (
    <CalendarClient
      tasks={tasksRes.data ?? []}
      projects={projectsRes.data ?? []}
      sprints={sprintsRes.data ?? []}
    />
  );
}
