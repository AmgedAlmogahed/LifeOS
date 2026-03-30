import { createClient } from "@/lib/supabase/server";
import { SprintsClient } from "./sprints-client";

export const dynamic = "force-dynamic";

export default async function SprintsPage() {
  const supabase = await createClient();
  const [sprintsRes, projectsRes] = await Promise.all([
    (supabase.from("sprints" as any) as any)
      .select("*, projects(name)")
      .order("start_date", { ascending: false }),
    supabase.from("projects").select("id, name").order("name"),
  ]);

  return (
    <SprintsClient
      sprints={(sprintsRes.data ?? []) as any[]}
      projects={(projectsRes.data ?? []) as any[]}
    />
  );
}
