"use server";

import { createClient } from "@/lib/supabase/server";

export async function getCriticalAuditLogs(limit = 5) {
    const supabase = await createClient();
    const { data } = await (supabase.from("audit_logs") as any)
        .select("*")
        .eq("level", "Critical")
        .order("created_at", { ascending: false })
        .limit(limit);
    
    return data || [];
}
