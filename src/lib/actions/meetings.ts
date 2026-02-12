"use server";

import { createClient } from "@/lib/supabase/server";
import { MeetingMinutesInsert, MeetingMinutesUpdate } from "@/types/database";
import { revalidatePath } from "next/cache";

export async function createMeeting(meeting: MeetingMinutesInsert) {
    const supabase = await createClient();
    const { data, error } = await supabase.from("meeting_minutes").insert(meeting).select().single();
    if (error) throw error;
    revalidatePath(`/projects/${meeting.project_id}`);
    return data;
}

export async function convertOutcomeToTask(outcome: string, projectId: string) {
    const supabase = await createClient();

    const task = {
        project_id: projectId,
        title: outcome, // outcome text becomes task title
        status: "Todo",
        priority: "Medium",
        type: "Implementation",
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week default
    };

    const { data, error } = await supabase.from("tasks").insert(task).select().single();
    if (error) throw error;

    // Optionally link back to meeting via metadata?
    // Not strictly needed for MVP.
    revalidatePath(`/projects/${projectId}`);
    return data;
}

export async function updateMeeting(id: string, update: MeetingMinutesUpdate) {
    const supabase = await createClient();
    const { error } = await supabase.from("meeting_minutes").update(update).eq("id", id);
    if (error) throw error;
}
