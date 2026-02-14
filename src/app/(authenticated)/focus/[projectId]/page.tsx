import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { FlowBoard } from "@/components/features/focus/FlowBoard";
import { Project, Task, Sprint, FocusSession } from "@/types/database";
import { getOrCreateSession } from "@/lib/actions/focus-sessions";

export default async function FocusPage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;
    const supabase = await createClient();

    // 1. Fetch Project (must be first — notFound depends on it)
    const { data: project } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

    if (!project) return notFound();

    // 2. Fetch session, sprint, and tasks in PARALLEL
    const [session, { data: activeSprint }, { data: tasks }] = await Promise.all([
        getOrCreateSession(projectId),
        supabase
            .from("sprints")
            .select("*")
            .eq("project_id", projectId)
            .eq("status", "active")
            .maybeSingle(),
        supabase
            .from("tasks")
            .select("*")
            .eq("project_id", projectId)
            .or(`status.neq.Done,completed_at.gt.${new Date(Date.now() - 86400000).toISOString()}`)
            .order("created_at", { ascending: false }),
    ]);

    return (
        <FlowBoard
            project={project as Project}
            activeSprint={activeSprint as Sprint | null}
            tasks={(tasks || []) as Task[]}
            activeSession={session as FocusSession}
        />
    );
}
