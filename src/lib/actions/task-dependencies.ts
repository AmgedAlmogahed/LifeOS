"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface TaskDependency {
    id: string;
    task_id: string;
    depends_on_task_id: string;
    created_at: string;
}

export async function getTaskDependencies(taskId: string): Promise<TaskDependency[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("task_dependencies" as any)
        .select("*")
        .eq("task_id", taskId);
    if (error) return [];
    return (data as unknown as TaskDependency[]) ?? [];
}

export async function addTaskDependency(taskId: string, dependsOnTaskId: string, projectId: string) {
    if (taskId === dependsOnTaskId) return { error: "A task cannot depend on itself" };
    const supabase = await createClient();
    const { error } = await supabase.from("task_dependencies" as any).insert({
        task_id: taskId,
        depends_on_task_id: dependsOnTaskId,
    });
    if (error) return { error: error.message };
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function removeTaskDependency(id: string, projectId: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("task_dependencies" as any).delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

/** Given a task, returns whether all its predecessor tasks are 'Done' */
export async function canStartTask(taskId: string): Promise<boolean> {
    const supabase = await createClient();
    const { data: deps } = await supabase
        .from("task_dependencies" as any)
        .select("depends_on_task_id")
        .eq("task_id", taskId);

    if (!deps || deps.length === 0) return true;
    const depIds = (deps as unknown as TaskDependency[]).map((d) => d.depends_on_task_id);

    const { data: depTasks } = await supabase
        .from("tasks")
        .select("id, status")
        .in("id", depIds);

    return (depTasks ?? []).every((t: { status: string }) => t.status === "Done");
}
