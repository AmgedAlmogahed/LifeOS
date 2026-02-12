"use server";

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

export async function updateTaskStatus(taskId: string, status: string) {
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
