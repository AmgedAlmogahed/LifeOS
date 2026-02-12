"use server";

export async function logCommunication(comm: CommunicationLogInsert) {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("communication_logs") as any).insert(comm).select().single();
    if (error) throw error;
    revalidatePath(`/clients/${comm.client_id}`);
    return data;
}

export async function createComms(comms: CommunicationLogInsert[]) {
    // For bulk import or syncing
    const supabase = await createClient();
    const { data, error } = await (supabase.from("communication_logs") as any).insert(comms).select();
    if (error) throw error;
    return data;
}

import { createClient } from "@/lib/supabase/server";
import { CommunicationLogInsert } from "@/types/database";
import { revalidatePath } from "next/cache";
