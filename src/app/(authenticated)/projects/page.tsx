import { createClient } from "@/lib/supabase/server";
import { ProjectList } from "./project-list";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) console.error("[projects page]", error.message);

  return <ProjectList projects={projects ?? []} />;
}
