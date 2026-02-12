import { createClient } from "@/lib/supabase/server";
import { DeploymentsPage } from "./deployments-client";

export const dynamic = "force-dynamic";

export default async function DeploymentsRoute() {
  const supabase = await createClient();
  const [deploymentsRes, projectsRes, clientsRes] = await Promise.all([
    supabase.from("deployments").select("*").order("created_at", { ascending: false }),
    supabase.from("projects").select("id, name"),
    supabase.from("clients").select("id, name"),
  ]);
  return (
    <DeploymentsPage
      deployments={(deploymentsRes.data ?? []) as any[]}
      projects={(projectsRes.data ?? []) as any[]}
      clients={(clientsRes.data ?? []) as any[]}
    />
  );
}
