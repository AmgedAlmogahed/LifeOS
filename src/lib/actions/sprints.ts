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

export async function completeSprint(sprintId: string, projectId: string, metrics: { completed_points: number, completed_task_count: number }) {
    // Close sprint
    return updateSprint(sprintId, {
        status: "completed",
        ended_at: new Date().toISOString(),
        ...metrics
    });
}
