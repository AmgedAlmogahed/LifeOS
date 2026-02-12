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
