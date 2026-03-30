"use server";

import { createClient } from "@/lib/supabase/server";
import type { StateSnapshot, StateSnapshotInsert } from "@/types/database";

export async function getStateSnapshots(projectId: string, limit = 10): Promise<StateSnapshot[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("state_snapshots" as any) as any)
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("[getStateSnapshots]", error.message);
        return [];
    }
    return (data || []) as StateSnapshot[];
}

export async function createStateSnapshot(
    snapshot: Omit<StateSnapshotInsert, "id" | "created_at">
): Promise<StateSnapshot | null> {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("state_snapshots" as any) as any)
        .insert(snapshot)
        .select()
        .single();

    if (error) {
        console.error("[createStateSnapshot]", error.message);
        return null;
    }
    return data as StateSnapshot;
}
