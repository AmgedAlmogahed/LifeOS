import { createClient } from "@/lib/supabase/server";
import { TasksClient } from "./tasks-client";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const supabase = await createClient();

  const [tasksRes, projectsRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("projects").select("id, name"),
  ]);

  return (
    <TasksClient
      tasks={tasksRes.data ?? []}
      projects={projectsRes.data ?? []}
    />
  );
}
