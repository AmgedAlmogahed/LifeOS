import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ForgeDetail } from "./forge-detail";

export const dynamic = "force-dynamic";

export default async function ForgeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [projectRes, tasksRes, assetsRes, lifecycleRes, clientsRes, phasesRes, modulesRes] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).maybeSingle(),
    supabase.from("tasks").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("project_assets").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("lifecycles").select("*").eq("project_id", id).limit(1),
    supabase.from("clients").select("id, name, brand_primary"),
    supabase.from("project_phases").select("*").eq("project_id", id).order("order_index", { ascending: true }),
    supabase.from("project_modules").select("*").eq("project_id", id).order("created_at", { ascending: true }),
  ]);

  if (!projectRes.data) redirect("/forge");

  const projectData = projectRes.data as any;
  const client = projectData.client_id
    ? ((clientsRes.data ?? []) as any[]).find((c: any) => c.id === projectData.client_id) ?? null
    : null;

  return (
    <ForgeDetail
      project={projectData}
      tasks={(tasksRes.data ?? []) as any[]}
      assets={(assetsRes.data ?? []) as any[]}
      lifecycle={((lifecycleRes.data ?? []) as any[])[0] ?? null}
      client={client}
      phases={(phasesRes.data ?? []) as any[]}
      modules={(modulesRes.data ?? []) as any[]}
    />
  );
}
