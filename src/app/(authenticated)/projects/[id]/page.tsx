import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProjectCanvas } from "./project-forge";
import type { Project, Sprint, Milestone, ProjectStateContext } from "@/types/database";
import { ScopeNode } from "@/lib/actions/scope-nodes";
import { AuthorityApplication } from "@/lib/actions/authority-applications";
import { TaskDependency } from "@/lib/actions/task-dependencies";

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

  if (!project) notFound();

  const [
    tasksRes,
    assetsRes,
    minutesRes,
    invoicesRes,
    sprintRes,
    milestonesRes,
    scopeNodesRes,
    authorityApplicationsRes,
    lastSessionRes,
    dependenciesRes,
    stateContextRes,
  ] = await Promise.all([
    supabase.from("tasks").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("project_assets").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("meeting_minutes").select("*").eq("project_id", id).order("date", { ascending: false }),
    supabase.from("invoices").select("*, clients(name)").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("sprints").select("*").eq("project_id", id).order("sprint_number", { ascending: true }),
    supabase.from("milestones").select("*").eq("project_id", id).order("deadline", { ascending: true }),
    supabase.from("scope_nodes" as any).select("*").eq("project_id", id).order("created_at", { ascending: true }),
    supabase.from("authority_applications" as any).select("*").eq("project_id", id).order("created_at", { ascending: false }),
    // Fetch last focus session notes for resume state
    supabase
      .from("focus_sessions")
      .select("session_notes, ended_at")
      .eq("project_id", id)
      .not("session_notes", "is", null)
      .not("ended_at", "is", null)
      .order("ended_at", { ascending: false })
      .limit(1),
    // Fetch all task dependencies for this project's tasks to compute Locked state
    supabase
      .from("task_dependencies" as any)
      .select("id, task_id, depends_on_task_id, created_at")
      .order("created_at", { ascending: true }),
    // Fetch project state context
    (supabase.from("project_state_context" as any) as any)
      .select("*")
      .eq("project_id", id)
      .maybeSingle(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resumeNote: string | null = (lastSessionRes.data as any[])?.[0]?.session_notes ?? null;

  return (
    <ProjectCanvas
      project={project}
      tasks={tasksRes.data ?? []}
      assets={assetsRes.data ?? []}
      minutes={(minutesRes.data as any[]) ?? []}
      invoices={(invoicesRes.data as any[]) ?? []}
      sprints={(sprintRes.data as Sprint[]) ?? []}
      milestones={(milestonesRes.data as Milestone[]) ?? []}
      scopeNodes={(scopeNodesRes.data as unknown as ScopeNode[]) ?? []}
      authorityApplications={(authorityApplicationsRes.data as unknown as AuthorityApplication[]) ?? []}
      resumeNote={resumeNote}
      taskDependencies={(dependenciesRes.data as unknown as TaskDependency[]) ?? []}
      projectStateContext={(stateContextRes.data as ProjectStateContext | null) ?? null}
    />
  );
}
