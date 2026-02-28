import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProjectCanvas } from "./project-forge";
import type { Project, Sprint, Milestone } from "@/types/database";
import { ScopeNode } from "@/lib/actions/scope-nodes";
import { AuthorityApplication } from "@/lib/actions/authority-applications";

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
  ] = await Promise.all([
    supabase.from("tasks").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("project_assets").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("meeting_minutes").select("*").eq("project_id", id).order("date", { ascending: false }),
    supabase.from("invoices").select("*, clients(name)").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("sprints").select("*").eq("project_id", id).eq("status", "active").limit(1),
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
  ]);

  const resumeNote: string | null =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (lastSessionRes.data as any[])?.[0]?.session_notes ?? null;

  console.log("[ProjectDetailPage] sprintRes:", sprintRes);

  return (
    <ProjectCanvas
      project={project}
      tasks={tasksRes.data ?? []}
      assets={assetsRes.data ?? []}
      minutes={(minutesRes.data as any[]) ?? []}
      invoices={(invoicesRes.data as any[]) ?? []}
      activeSprint={(sprintRes.data as any[])?.[0] as Sprint | null}
      milestones={(milestonesRes.data as Milestone[]) ?? []}
      scopeNodes={(scopeNodesRes.data as unknown as ScopeNode[]) ?? []}
      authorityApplications={(authorityApplicationsRes.data as unknown as AuthorityApplication[]) ?? []}
      resumeNote={resumeNote}
    />
  );
}
