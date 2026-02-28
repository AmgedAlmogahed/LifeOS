import { createClient } from "@/lib/supabase/server";
import { PortalClient } from "./portal-client";

export const dynamic = "force-dynamic";

export default async function PortalRoute() {
  const supabase = await createClient();

  // Fetch relevant domain entities
  const [accountsRes, projectsRes, modulesRes, platformsRes] = await Promise.all([
    supabase.from("accounts").select("*").order("name"),
    supabase.from("projects").select("id, name, status, budget, account_id").order("updated_at", { ascending: false }),
    supabase.from("modules").select("id, name, priority_level, project_id").order("priority_level", { ascending: false }),
    supabase.from("platforms").select("*").order("name"),
  ]);

  return (
    <PortalClient
      accounts={(accountsRes.data ?? []) as any[]}
      projects={(projectsRes.data ?? []) as any[]}
      modules={(modulesRes.data ?? []) as any[]}
      platforms={(platformsRes.data ?? []) as any[]}
    />
  );
}
