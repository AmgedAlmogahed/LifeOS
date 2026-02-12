"use server";

import { createClient } from "@/lib/supabase/server";
import { QuickCaptureInsert } from "@/types/database";
import { revalidatePath } from "next/cache";

export async function createCapture(capture: QuickCaptureInsert) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser(); // or auth.getUser() returns {data: {user}}

    // Check if user exists?

    const { error } = await supabase.from("quick_captures").insert({
        ...capture,
        user_id: user?.id
    });

    if (error) throw error;
    revalidatePath("/inbox");
    revalidatePath("/cockpit");
}

export async function dismissCapture(captureId: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("quick_captures").update({ status: 'dismissed' }).eq("id", captureId);
    if (error) throw error;
    revalidatePath("/inbox");
    revalidatePath("/plan");
}

export async function processCapture(captureId: string, processedTaskId?: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("quick_captures").update({
        status: 'processed',
        processed_at: new Date().toISOString(),
        created_task_id: processedTaskId
    }).eq("id", captureId);

    if (error) throw error;
    revalidatePath("/inbox");
}

export async function getUnprocessedCaptures() {
    const supabase = await createClient();
    const { data, error } = await supabase.from("quick_captures")
        .select("*")
        .eq("status", "captured")
        .order("created_at", { ascending: false });

    if (error) console.error("Error fetching captures:", error);
    return data || [];
}
