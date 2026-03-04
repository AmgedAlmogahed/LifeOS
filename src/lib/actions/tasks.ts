"use server";

import { createClient } from "@/lib/supabase/server";
import { TaskInsert, TaskUpdate } from "@/types/database";
import { revalidatePath } from "next/cache";

export async function createTask(task: TaskInsert) {
    const supabase = await createClient();
    // Default values if not provided?
    // task.is_recurring must be provided as per TS if it's required in Task.
    // We assume the caller provides a valid object.

    // Auto-fix defaults for boolean if missing in runtime?
    // But TS will enforce compile time.

    const { data, error } = await (supabase.from("tasks") as any).insert(task).select().single();
    if (error) throw error;

    revalidatePath("/inbox");
    revalidatePath("/dashboard");
    revalidatePath("/tasks");
    if (task.project_id) revalidatePath(`/projects/${task.project_id}`);

    return data;
}

export async function updateTask(id: string, update: TaskUpdate) {
    const supabase = await createClient();
    const { error } = await (supabase.from("tasks") as any).update(update).eq("id", id);
    if (error) throw error;

    revalidatePath("/inbox");
    revalidatePath("/dashboard");
    revalidatePath("/tasks");
}

export async function deleteTask(id: string) {
    const supabase = await createClient();
    const { error } = await (supabase.from("tasks") as any).delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/inbox");
    revalidatePath("/dashboard");
    revalidatePath("/tasks");
}

export async function commitTasks(taskIds: string[], date: string) {
    const supabase = await createClient();
    const { error } = await (supabase.from("tasks") as any)
        .update({ committed_date: date })
        .in("id", taskIds);

    if (error) throw error;

    revalidatePath("/dashboard");
    revalidatePath("/plan");
    revalidatePath("/focus");
}

export async function shiftTaskAndDependents(taskId: string, newStart: string, newEnd: string, projectId: string) {
    const supabase = await createClient();

    // Fetch original task to calculate delta
    const { data: originalTask } = (await supabase.from("tasks").select("start_date, due_date").eq("id", taskId).single()) as any;
    if (!originalTask || !originalTask.start_date) {
        // Just update it if we don't have a baseline to calculate delta
        await (supabase.from("tasks") as any).update({ start_date: newStart, due_date: newEnd } as any).eq("id", taskId);
        revalidatePath(`/projects/${projectId}`);
        return { success: true };
    }

    const deltaMs = new Date(newStart).getTime() - new Date(originalTask.start_date).getTime();

    // Helper to recursively shift
    async function shiftDependents(parentId: string, currentDelta: number) {
        const { data: deps } = (await supabase.from("task_dependencies" as any)
            .select("task_id")
            .eq("depends_on_task_id", parentId)) as any;

        if (!deps || deps.length === 0) return;

        for (const dep of deps) {
            const { data: childTask } = (await supabase.from("tasks").select("id, start_date, due_date").eq("id", dep.task_id).single()) as any;
            if (childTask && childTask.start_date) {
                const childNewStart = new Date(new Date(childTask.start_date).getTime() + currentDelta).toISOString();
                const childNewEnd = childTask.due_date
                    ? new Date(new Date(childTask.due_date).getTime() + currentDelta).toISOString()
                    : null;

                await (supabase.from("tasks") as any).update({ start_date: childNewStart, due_date: childNewEnd } as any).eq("id", childTask.id);
                // Traverse down recursively (critical path chaining)
                await shiftDependents(childTask.id, currentDelta);
            }
        }
    }

    // 1. Update the parent task 
    await (supabase.from("tasks") as any).update({ start_date: newStart, due_date: newEnd } as any).eq("id", taskId);

    // 2. Auto-shift all descendants
    if (deltaMs !== 0) {
        await shiftDependents(taskId, deltaMs);
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}
