"use server";

import { createClient } from "@/lib/supabase/server";
import type { DelegationLogEntry, DelegationStatus } from "@/types/database";
import { revalidatePath } from "next/cache";

export async function getDelegationLog(filters?: {
    status?: DelegationStatus;
    agent_id?: string;
    limit?: number;
}): Promise<(DelegationLogEntry & { tasks?: { title: string; project_id: string | null } })[]> {
    const supabase = await createClient();
    let query = (supabase.from("delegation_log" as any) as any)
        .select("*, tasks(title, project_id)")
        .order("delegated_at", { ascending: false });

    if (filters?.status) {
        query = query.eq("status", filters.status);
    }
    if (filters?.agent_id) {
        query = query.eq("agent_id", filters.agent_id);
    }
    query = query.limit(filters?.limit || 50);

    const { data, error } = await query;
    if (error) {
        console.error("[getDelegationLog]", error.message);
        return [];
    }
    return (data || []) as any[];
}

export async function getRecentDelegations(limit = 10): Promise<DelegationLogEntry[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("delegation_log" as any) as any)
        .select("*, tasks(title, project_id)")
        .order("delegated_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("[getRecentDelegations]", error.message);
        return [];
    }
    return (data || []) as any[];
}

export async function createDelegation(data: {
    task_id: string;
    agent_id: string;
}): Promise<DelegationLogEntry | null> {
    const supabase = await createClient();

    // 1. Create delegation log entry
    const { data: delegation, error } = await (supabase.from("delegation_log" as any) as any)
        .insert({
            task_id: data.task_id,
            agent_id: data.agent_id,
            status: "pending",
            delegated_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) throw error;

    // 2. Update task delegation fields
    await (supabase.from("tasks") as any).update({
        delegated_to: data.agent_id,
        delegation_status: "delegated",
        agent_assignable: true,
        assigned_agent: data.agent_id,
    }).eq("id", data.task_id);

    revalidatePath("/tasks");
    revalidatePath("/cockpit");
    revalidatePath("/terminal");
    return delegation as DelegationLogEntry;
}

export async function updateDelegationStatus(
    id: string,
    status: DelegationStatus,
    resultSummary?: string
): Promise<void> {
    const supabase = await createClient();
    const update: Record<string, any> = { status };

    if (resultSummary !== undefined) {
        update.result_summary = resultSummary;
    }
    if (status === "completed" || status === "failed") {
        update.completed_at = new Date().toISOString();
    }

    const { error } = await (supabase.from("delegation_log" as any) as any)
        .update(update)
        .eq("id", id);

    if (error) throw error;
    revalidatePath("/terminal");
    revalidatePath("/cockpit");
}
