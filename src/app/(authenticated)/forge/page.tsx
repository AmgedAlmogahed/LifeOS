import { createClient } from "@/lib/supabase/server";
import { ForgeList } from "./forge-client";

export const dynamic = "force-dynamic";

export default async function ForgeRoute() {
  const supabase = await createClient();
  const [projectsRes, clientsRes, lifecyclesRes, sprintsRes] = await Promise.all([
    supabase.from("projects").select("*").order("updated_at", { ascending: false }),
    supabase.from("clients").select("id, name, brand_primary"),
    supabase.from("lifecycles").select("*"),
    supabase.from("sprints").select("*").eq("status", "active"), 
  ]);
  return (
    <ForgeList
      projects={(projectsRes.data ?? []) as any[]}
      clients={(clientsRes.data ?? []) as any[]}
      lifecycles={(lifecyclesRes.data ?? []) as any[]}
      activeSprints={(sprintsRes.data ?? []) as any[]}
    />
  );
}
