import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { FlowBoard } from "@/components/features/focus/FlowBoard";
import { Project, Task, Sprint, FocusSession } from "@/types/database";
import { getOrCreateSession } from "@/lib/actions/focus-sessions";

export default async function FocusPage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;
    const supabase = await createClient();

    // 1. Fetch Project
    const { data: project } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

    if (!project) return notFound();

    // 2. Auto-create focus session (entering Focus page IS starting a session)
    // This also cleans up stale sessions from previous days
    const session = await getOrCreateSession(projectId);

    // 3. Fetch Active Sprint
    const { data: activeSprint } = await supabase
        .from("sprints")
        .select("*")
        .eq("project_id", projectId)
        .eq("status", "active")
        .maybeSingle();

    // 4. Fetch Tasks (not Done, or Done within last 24h for DoneRibbon)
    const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .or(`status.neq.Done,completed_at.gt.${new Date(Date.now() - 86400000).toISOString()}`)
        .order("created_at", { ascending: false });

    return (
        <FlowBoard
            project={project as Project}
            activeSprint={activeSprint as Sprint | null}
            tasks={(tasks || []) as Task[]}
            activeSession={session as FocusSession}
        />
    );
}
