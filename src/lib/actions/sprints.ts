"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SprintInsert, SprintUpdate } from "@/types/database";

export async function createSprint(projectId: string, data: Partial<SprintInsert>) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    // Calculate sprint number by finding the highest existing number across ALL users in the project
    // We use the admin client to bypass the "Users can manage own sprints" RLS policy,
    // otherwise if User B created Sprint 1, User A wouldn't see it and would also try to create Sprint 1.
    const adminSupabase = createAdminClient();
    const { data: latestSprint } = await adminSupabase
        .from("sprints")
        .select("sprint_number")
        .eq("project_id", projectId)
        .order("sprint_number", { ascending: false })
        .limit(1)
        .maybeSingle();

    const sprintNumber = latestSprint?.sprint_number ? latestSprint.sprint_number + 1 : 1;

    const { data: sprint, error } = await supabase
        .from("sprints")
        .insert({
            project_id: projectId,
            user_id: user.id,
            sprint_number: sprintNumber,
            status: data.status || "planning", // respect caller's status
            planned_end_at: data.planned_end_at!,
            started_at: data.started_at || new Date().toISOString(),
            ...data,
        })
        .select()
        .single();

    if (error) {
        console.error("[createSprint]", error.message);
        return { error: error.message };
    }

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/focus/${projectId}`);
    return { success: true, data: sprint };
}

export async function createMultipleSprints(
    projectId: string,
    count: number,
    durationWeeks: number,
    startDate: string
) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const adminSupabase = createAdminClient();
    const { data: latestSprint } = await adminSupabase
        .from("sprints")
        .select("sprint_number")
        .eq("project_id", projectId)
        .order("sprint_number", { ascending: false })
        .limit(1)
        .maybeSingle();

    const startNumber = latestSprint?.sprint_number ? latestSprint.sprint_number + 1 : 1;

    const sprintsToInsert = [];
    let currentStartDate = new Date(startDate);

    for (let i = 0; i < count; i++) {
        const plannedEndAt = new Date(currentStartDate);
        plannedEndAt.setDate(plannedEndAt.getDate() + (durationWeeks * 7));

        sprintsToInsert.push({
            project_id: projectId,
            user_id: user.id,
            sprint_number: startNumber + i,
            status: "planning",
            started_at: currentStartDate.toISOString(),
            planned_end_at: plannedEndAt.toISOString(),
            goal: `Phase ${startNumber + i}`, // Default goal placeholder
        });

        // Set next start date to the end of the previous one
        currentStartDate = new Date(plannedEndAt);
    }

    const { data, error } = await supabase
        .from("sprints")
        .insert(sprintsToInsert)
        .select();

    if (error) {
        console.error("[createMultipleSprints]", error.message);
        return { error: error.message };
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true, data };
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

        // Carry-forward: find the NEXT planned sprint or default to backlog
        if (taskDecisions.carryForward.length > 0) {
            // Find current sprint number first to search forwards
            const { data: currentSprint } = await supabase
                .from("sprints")
                .select("sprint_number")
                .eq("id", sprintId)
                .single();

            const currentNum = currentSprint?.sprint_number || 0;

            const { data: nextSprint } = await supabase
                .from("sprints")
                .select("id")
                .eq("project_id", projectId)
                .eq("status", "planning")
                .gt("sprint_number", currentNum)
                .order("sprint_number", { ascending: true })
                .limit(1)
                .maybeSingle();

            const targetSprintId = nextSprint?.id || null;

            await supabase.from("tasks")
                .update({
                    sprint_id: targetSprintId,
                    added_to_sprint_at: targetSprintId ? new Date().toISOString() : null
                })
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
