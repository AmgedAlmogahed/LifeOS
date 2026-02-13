"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SprintInsert, SprintUpdate } from "@/types/database";

export async function createSprint(projectId: string, data: Partial<SprintInsert>) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    // Calculate sprint number
    const { count } = await supabase
        .from("sprints")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

    const sprintNumber = (count || 0) + 1;

    const { data: sprint, error } = await supabase
        .from("sprints")
        .insert({
            ...data,
            project_id: projectId,
            user_id: user.id,
            sprint_number: sprintNumber,
            status: "planning", // Default status
            planned_end_at: data.planned_end_at!, // Fix property name mismatch
            started_at: (data.started_at || null) as unknown as string, // Cast to satisfy potential strict type mismatch
        })
        .select()
        .single();

    if (error) return { error: error.message };

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/focus/${projectId}`);
    return { success: true, data: sprint };
}

export async function updateSprint(sprintId: string, data: SprintUpdate) {
    const supabase = await createClient();

    const { data: sprint, error } = await supabase
        .from("sprints")
        .update(data)
        .eq("id", sprintId)
        .select()
        .single();

    if (error) return { error: error.message };

    if (sprint) {
        revalidatePath(`/projects/${sprint.project_id}`);
        revalidatePath(`/focus/${sprint.project_id}`);
    }
    return { success: true, data: sprint };
}

export async function deleteSprint(sprintId: string, projectId: string) {
    const supabase = await createClient();

    const { error } = await supabase.from("sprints").delete().eq("id", sprintId);

    if (error) return { error: error.message };

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/focus/${projectId}`);
    return { success: true };
}

export async function startSprint(sprintId: string, projectId: string) {
    // Ensure no other active sprints for this project?
    // Spec says 1 active sprint.
    const supabase = await createClient();

    // Check for active sprints
    const { data: activeSprints } = await supabase
        .from("sprints")
        .select("id")
        .eq("project_id", projectId)
        .eq("status", "active");

    if (activeSprints && activeSprints.length > 0) {
        return { error: "There is already an active sprint for this project." };
    }

    // Start sprint
    return updateSprint(sprintId, { status: "active", started_at: new Date().toISOString() });
}

export async function completeSprint(
    sprintId: string,
    projectId: string,
    taskDecisions?: { carryForward: string[]; backlog: string[]; drop: string[] }
) {
    const supabase = await createClient();

    // Handle task decisions before metrics calculation
    if (taskDecisions) {
        // Backlog: set sprint_id = null
        if (taskDecisions.backlog.length > 0) {
            await supabase.from("tasks")
                .update({ sprint_id: null, added_to_sprint_at: null })
                .in("id", taskDecisions.backlog);
        }

        // Drop: set status = 'Cancelled'
        if (taskDecisions.drop.length > 0) {
            await supabase.from("tasks")
                .update({ status: "Cancelled" })
                .in("id", taskDecisions.drop);
        }

        // Carry-forward: set sprint_id = null (ready for next sprint planning)
        if (taskDecisions.carryForward.length > 0) {
            await supabase.from("tasks")
                .update({ sprint_id: null, added_to_sprint_at: null })
                .in("id", taskDecisions.carryForward);
        }
    }

    // 1. Fetch all tasks in this sprint to calculate metrics
    const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("status, story_points, time_spent_minutes")
        .eq("sprint_id", sprintId);

    if (tasksError) return { error: tasksError.message };

    // 2. Calculate metrics
    const completedTasks = tasks.filter(t => t.status === "Done");
    const completedPoints = completedTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
    const completedTaskCount = completedTasks.length;
    const focusTimeMinutes = tasks.reduce((sum, t) => sum + (t.time_spent_minutes || 0), 0);

    // 3. Close sprint with calculated metrics
    return updateSprint(sprintId, {
        status: "completed",
        ended_at: new Date().toISOString(),
        completed_points: completedPoints,
        completed_task_count: completedTaskCount,
        focus_time_minutes: focusTimeMinutes
    });
}

export async function cancelSprint(sprintId: string, projectId: string) {
    const supabase = await createClient();

    // 1. Mark sprint as cancelled
    const { error: sprintError } = await supabase
        .from("sprints")
        .update({ status: "cancelled", ended_at: new Date().toISOString() })
        .eq("id", sprintId);

    if (sprintError) return { error: sprintError.message };

    // 2. Unassign tasks from the cancelled sprint (optional, but cleaner for backlog)
    // Or keep them assigned to show history? Spec implies 'cancelled' status on sprint is enough.
    // But usually tasks should go back to backlog.
    // Let's clear sprint_id for tasks that are not done?
    // Spec doesn't explicitly say. "Tasks return to backlog".
    const { error: tasksError } = await supabase
        .from("tasks")
        .update({ sprint_id: null, added_to_sprint_at: null })
        .eq("sprint_id", sprintId)
        .neq("status", "Done"); // Keep completed tasks associated? Or clear all? 
    // Actually, if sprint is cancelled, usually all open tasks go to backlog.

    if (tasksError) return { error: tasksError.message };

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/focus/${projectId}`);
    return { success: true };
}
