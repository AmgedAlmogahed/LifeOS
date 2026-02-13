"use server";
// TODO: GAP-11 - Consider adding toast "Task added to sprint (+1 scope change)" when moveTaskToSprint is called during active sprint

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Task, Json } from "@/types/database";

export interface Subtask {
    id: string;
    title: string;
    completed: boolean;
}

export async function toggleTaskCurrent(taskId: string, projectId: string) {
    const supabase = await createClient();

    // 1. Unset any existing current task for this project
    // We do this first to ensure only one is current.
    await supabase
        .from("tasks")
        .update({ is_current: false })
        .eq("project_id", projectId)
        .eq("is_current", true);

    // 2. Set the new task as current
    const { data, error } = await supabase
        .from("tasks")
        .update({ is_current: true })
        .eq("id", taskId)
        .select()
        .single();

    if (error) return { error: error.message };

    revalidatePath(`/focus/${projectId}`);
    return { success: true, data };
}

export async function unsetCurrentTask(projectId: string) {
    const supabase = await createClient();
    await supabase
        .from("tasks")
        .update({ is_current: false })
        .eq("project_id", projectId)
        .eq("is_current", true);

    revalidatePath(`/focus/${projectId}`);
    return { success: true };
}

export async function updateSubtasks(taskId: string, subtasks: Subtask[]) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("tasks")
        // Cast subtasks to Json compatible type for update
        .update({ subtasks: subtasks as unknown as Json })
        .eq("id", taskId)
        .select()
        .single();

    if (error) return { error: error.message };

    // Revalidate relevant paths
    // We don't have project_id here easily without fetching task first?
    // But usually update returns data including project_id.
    if (data?.project_id) {
        revalidatePath(`/focus/${data.project_id}`);
    }
    return { success: true, data };
}

export async function addSubtask(taskId: string, title: string) {
    const supabase = await createClient();

    // Fetch current subtasks
    const { data: task } = await supabase
        .from("tasks")
        .select("subtasks, project_id")
        .eq("id", taskId)
        .single();

    if (!task) return { error: "Task not found" };

    const currentSubtasks = (task.subtasks as unknown as Subtask[]) || [];
    const newSubtask: Subtask = {
        id: crypto.randomUUID(),
        title,
        completed: false
    };

    const updatedSubtasks = [...currentSubtasks, newSubtask];

    const { error } = await supabase
        .from("tasks")
        .update({ subtasks: updatedSubtasks as unknown as Json })
        .eq("id", taskId);

    if (error) return { error: error.message };

    if (task.project_id) revalidatePath(`/focus/${task.project_id}`);
    return { success: true, subtasks: updatedSubtasks };
}

export async function toggleSubtask(taskId: string, subtaskId: string, completed: boolean) {
    const supabase = await createClient();

    // Fetch
    const { data: task } = await supabase
        .from("tasks")
        .select("subtasks, project_id")
        .eq("id", taskId)
        .single();

    if (!task) return { error: "Task not found" };

    const currentSubtasks = (task.subtasks as unknown as Subtask[]) || [];
    const updatedSubtasks = currentSubtasks.map(st =>
        st.id === subtaskId ? { ...st, completed } : st
    );

    const { error } = await supabase
        .from("tasks")
        .update({ subtasks: updatedSubtasks as unknown as Json })
        .eq("id", taskId);

    if (error) return { error: error.message };

    if (task.project_id) revalidatePath(`/focus/${task.project_id}`);
    return { success: true, subtasks: updatedSubtasks };
}

export async function moveTaskToSprint(taskId: string, sprintId: string | null, projectId: string) {
    const supabase = await createClient();

    // 1. Check for Scope Change if adding to a sprint
    if (sprintId) {
        const { data: sprint } = await supabase
            .from("sprints")
            .select("id, status, started_at, scope_changes")
            .eq("id", sprintId)
            .single();

        if (sprint && sprint.status === "active" && sprint.started_at) {
            const now = new Date();
            const startedAt = new Date(sprint.started_at);

            // If sprint started more than a minute ago (buffer), count as scope change
            if (now.getTime() - startedAt.getTime() > 60000) {
                const newScopeChanges = (sprint.scope_changes || 0) + 1;
                await supabase
                    .from("sprints")
                    .update({ scope_changes: newScopeChanges })
                    .eq("id", sprintId);
            }
        }
    }

    const { error } = await supabase
        .from("tasks")
        .update({
            sprint_id: sprintId,
            added_to_sprint_at: sprintId ? new Date().toISOString() : null
        })
        .eq("id", taskId);


    if (error) return { error: error.message };

    revalidatePath(`/focus/${projectId}`);
    // Also revalidate project page
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function logTime(taskId: string, minutes: number) {
    const supabase = await createClient();

    // Increment logic? Or set total? Spec says "log time". Usually increment.
    // But Supabase doesn't support atomic increment easily via simple update unless using RPC or raw SQL.
    // For now, read-modify-write. Concurrency risk is low for single user.

    const { data: task } = await supabase.from("tasks").select("time_spent_minutes, project_id").eq("id", taskId).single();
    if (!task) return { error: "Task not found" };

    const newTotal = (task.time_spent_minutes || 0) + minutes;

    const { error } = await supabase
        .from("tasks")
        .update({ time_spent_minutes: newTotal })
        .eq("id", taskId);

    if (error) return { error: error.message };

    if (task.project_id) revalidatePath(`/focus/${task.project_id}`);
    return { success: true };
}

export async function skipTask(taskId: string) {
    const supabase = await createClient();

    // Read current skip_count
    const { data: task } = await supabase.from("tasks").select("skip_count, project_id").eq("id", taskId).single();
    if (!task) return { error: "Task not found" };

    const newCount = (task.skip_count || 0) + 1;

    const { error } = await supabase
        .from("tasks")
        .update({ skip_count: newCount, is_current: false })
        .eq("id", taskId);

    if (error) return { error: error.message };

    if (task.project_id) revalidatePath(`/focus/${task.project_id}`);
    return { success: true };
}

export async function updateTaskStatus(taskId: string, status: "Todo" | "In Progress" | "Done" | "Blocked") {
    const supabase = await createClient();

    const { data: task, error } = await supabase
        .from("tasks")
        .update({ status })
        .eq("id", taskId)
        .select("project_id")
        .single();

    if (error) return { error: error.message };

    if (task?.project_id) {
        revalidatePath(`/focus/${task.project_id}`);
        revalidatePath(`/projects/${task.project_id}`);
    }
    return { success: true };
}
