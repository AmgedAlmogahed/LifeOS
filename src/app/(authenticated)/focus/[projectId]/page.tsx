import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { FlowBoard } from "@/components/features/focus/FlowBoard";
import { Project, Task, Sprint, FocusSession } from "@/types/database";

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

    // 2. Fetch Active Sprint
    const { data: activeSprint } = await supabase
        .from("sprints")
        .select("*")
        .eq("project_id", projectId)
        .eq("status", "active")
        .maybeSingle();

    // 3. Fetch Tasks
    // We want all tasks that are:
    // - NOT Done
    // - OR Done within last 24h
    // This allows Flow Board to organize them into Current, Queue, Backlog.
    // If sprint is active, backlog will be sprint backlog.
    // Non-sprint tasks will be hidden or in a separate list? 
    // FlowBoard logic filters based on sprint_id. So if we fetch *all*, we rely on client filtering.
    // But for performance, maybe we should fetch only sprint tasks + current?
    // Let's stick to fetching all relevant tasks for now.
    
    const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .or(`status.neq.Done,completed_at.gt.${new Date(Date.now() - 86400000).toISOString()}`)
        .order("created_at", { ascending: false });

    // 4. Fetch Active Focus Session
    const { data: session } = await supabase
        .from("focus_sessions")
        .select("*")
        .eq("project_id", projectId)
        .is("ended_at", null)
        .maybeSingle();

    return (
        <FlowBoard 
            project={project as Project} 
            activeSprint={activeSprint as Sprint | null} 
            tasks={(tasks || []) as Task[]}
            initialSession={session as FocusSession | null}
        />
    );
}
