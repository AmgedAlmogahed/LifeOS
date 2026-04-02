import { createClient } from "@/lib/supabase/server";
import { ProjectList } from "./project-list";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const supabase = await createClient();

  const [projectsResult, accountsResult] = await Promise.all([
    (supabase.from("projects") as any)
      .select("*, clients!projects_client_id_fkey(name), accounts(name, primary_color)")
      .order("updated_at", { ascending: false }),
    supabase.from("accounts").select("id, name, primary_color")
  ]);

  if (projectsResult.error) console.error("[projects page]", projectsResult.error.message);

  return (
    <ProjectList 
      initialProjects={(projectsResult.data as any) ?? []} 
      accounts={(accountsResult.data as any) ?? []} 
    />
  );
}
