"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createFocusSession(projectId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Check for existing active session
    const { data: existingSession } = await supabase
        .from("focus_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("project_id", projectId)
        .is("ended_at", null)
        .maybeSingle();

    if (existingSession) {
        return existingSession;
    }

    const { data, error } = await supabase.from("focus_sessions").insert({
        project_id: projectId,
        user_id: user.id,
        started_at: new Date().toISOString(),
    }).select().single();

    if (error) throw error;
    // Note: no revalidatePath here — this function is called during server component
    // render (via getOrCreateSession in page.tsx). Next.js 16 forbids revalidation
    // during render. The cockpit will see the new session on next navigation.
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

/**
 * Close any sessions that were left open from a previous day.
 * This handles the case where a user closes the browser without ending their session.
 */
export async function cleanupStaleSessions(projectId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Find active sessions that started before today
    const { data: staleSessions } = await supabase
        .from("focus_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("project_id", projectId)
        .is("ended_at", null)
        .lt("started_at", todayStart.toISOString());

    if (staleSessions && staleSessions.length > 0) {
        const staleIds = staleSessions.map(s => s.id);
        await supabase
            .from("focus_sessions")
            .update({ ended_at: todayStart.toISOString(), session_notes: "Auto-closed: stale session from previous day" })
            .in("id", staleIds);
    }
}

/**
 * The main entry point for Focus page load.
 * Philosophy: entering Focus page IS starting a session.
 * 1. Clean up stale sessions from previous days
 * 2. Return existing active session if one exists
 * 3. Create a new session if none exists
 */
export async function getOrCreateSession(projectId: string) {
    // Step 1: Clean up any leftover sessions from previous days
    await cleanupStaleSessions(projectId);

    // Step 2: Check for existing active session (reuse createFocusSession which is already idempotent)
    const session = await createFocusSession(projectId);
    return session;
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
