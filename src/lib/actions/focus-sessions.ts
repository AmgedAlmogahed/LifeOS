"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createFocusSession(projectId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Check for existing active session? Or allow multiple? Spec implies one focused project.
    // Spec doesn't strictly forbid multiple, but "Focus Mode" implies single.
    // For now, simple insert.

    const { data, error } = await supabase.from("focus_sessions").insert({
        project_id: projectId,
        user_id: user.id,
        started_at: new Date().toISOString(),
    }).select().single();

    if (error) throw error;
    return data;
}

export async function endFocusSession(sessionId: string, notes: string | null) {
    const supabase = await createClient();
    const { error } = await supabase.from("focus_sessions").update({
        ended_at: new Date().toISOString(),
        session_notes: notes
    }).eq("id", sessionId);

    if (error) throw error;
    revalidatePath("/cockpit");
}

export async function getActiveFocusSession(projectId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.from("focus_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("project_id", projectId)
        .is("ended_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .single();

    // .single() throws if 0 rows, so we handle it?
    // actually .maybeSingle() is safer
    if (error && error.code !== "PGRST116") { // non-406 error
        console.error("Error fetching active session:", error);
    }

    // Explicitly return null if not found (Supabase returns null data with maybeSingle?)
    // But .single() returns error if 0.
    // Let's retry with proper query without .single() catch, or use maybeSingle.

    const { data: safeData } = await supabase.from("focus_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("project_id", projectId)
        .is("ended_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    return safeData;
}

export async function getLastCompletedSession(projectId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase.from("focus_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("project_id", projectId)
        .not("ended_at", "is", null)
        .order("ended_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    return data;
}

export async function incrementSessionTaskCount(sessionId: string) {
    const supabase = await createClient();

    // Read first
    const { data: session } = await supabase.from("focus_sessions").select("tasks_completed").eq("id", sessionId).single();
    if (!session) return;

    const { error } = await supabase.from("focus_sessions").update({
        tasks_completed: (session.tasks_completed || 0) + 1
    }).eq("id", sessionId);

    if (error) throw error;
}
