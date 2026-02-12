import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProjectForge } from "./project-forge";
import type { Project } from "@/types/database";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single() as { data: Project | null };

  if (!project) {
    notFound();
  }

  const tasksRes = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const assetsRes = await supabase
    .from("project_assets")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const minutesRes = await supabase
    .from("meeting_minutes")
    .select("*")
    .eq("project_id", id)
    .order("date", { ascending: false });

  const invoicesRes = await supabase
    .from("invoices")
    .select("*, clients(name)")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  return (
    <ProjectForge
      project={project}
      tasks={tasksRes.data ?? []}
      assets={assetsRes.data ?? []}
      minutes={minutesRes.data ?? []}
      invoices={(invoicesRes.data as any[]) ?? []}
    />
  );
}
