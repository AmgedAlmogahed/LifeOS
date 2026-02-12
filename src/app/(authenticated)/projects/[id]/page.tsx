import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProjectDetailClient } from "./project-detail-client";
import type { Project, Task } from "@/types/database";

export const dynamic = "force-dynamic";


interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single() as { data: Project | null; error: unknown };

  if (projectError || !project) {
    notFound();
  }

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false }) as { data: Task[] | null };

  return (
    <ProjectDetailClient
      project={project}
      tasks={tasks ?? []}
    />
  );
}
