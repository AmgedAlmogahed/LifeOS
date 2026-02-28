import { createClient } from "@/lib/supabase/server";
import { ModulesClient } from "./modules-client";
import type { Module, Project } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ModulesPage() {
  const supabase = await createClient();

  // Fetch all modules with their associated project details
  const [modulesRes, projectsRes] = await Promise.all([
    supabase
      .from("modules")
      .select("*")
      .order("priority_level", { ascending: false }),
    supabase
      .from("projects")
      .select("id, name, status, category"),
  ]);

  return (
    <ModulesClient
      modules={(modulesRes.data as Module[]) ?? []}
      projects={(projectsRes.data as Project[]) ?? []}
    />
  );
}
