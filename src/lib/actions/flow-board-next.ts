"use server";
// TODO: GAP-14 (P3) — Smarter next-task scoring (skip_count penalty, priority weighting, deadline proximity)

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getNextTask(projectId: string, currentTaskId: string) {
    const supabase = await createClient();

    // Strategy:
    // 1. Check for other "In Progress" tasks in the active sprint?
    // 2. Check for the top "Todo" task in the active sprint (Queue)?
    // 3. Check for top task in Project Backlog?

    // First, find the active sprint
    const { data: activeSprint } = await supabase
        .from('sprints')
        .select('id')
        .eq('project_id', projectId)
        .eq('status', 'active')
        .single();

    let nextTask = null;

    if (activeSprint) {
        // Look for next In Progress
        const { data: inProgress } = await supabase
            .from('tasks')
            .select('*')
            .eq('sprint_id', activeSprint.id)
            .eq('status', 'In Progress')
            .neq('id', currentTaskId)
            .limit(1)
            .single();

        if (inProgress) {
            nextTask = inProgress;
        } else {
            // Look for top Todo
            const { data: todo } = await supabase
                .from('tasks')
                .select('*')
                .eq('sprint_id', activeSprint.id)
                .eq('status', 'Todo')
                .neq('id', currentTaskId)
                // .order('priority_score', { ascending: false }) // If we had priority score
                .order('created_at', { ascending: true }) // FIFO for now
                .limit(1)
                .single();
            if (todo) nextTask = todo;
        }
    } else {
        // No active sprint, check project backlog
        const { data: backlog } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', projectId)
            .is('sprint_id', null)
            .neq('status', 'Done')
            .neq('id', currentTaskId)
            .order('created_at', { ascending: true })
            .limit(1)
            .single();
        if (backlog) nextTask = backlog;
    }

    return { task: nextTask };
}
