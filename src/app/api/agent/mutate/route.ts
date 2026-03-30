import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const AGENT_API_KEY = process.env.AGENT_API_KEY || "lifeos-agent-key-change-me";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Tables agents can write to (intentionally restrictive)
const WRITABLE_TABLES = [
    "tasks", "delegation_log", "state_snapshots", "project_state_context",
    "agent_reports", "focus_sessions", "expenses",
];

function authenticate(req: NextRequest): boolean {
    const key = req.headers.get("x-agent-key");
    return key === AGENT_API_KEY;
}

export async function POST(req: NextRequest) {
    if (!authenticate(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { action, table, data, id, match } = body;

        if (!table || !WRITABLE_TABLES.includes(table)) {
            return NextResponse.json(
                { error: `Table "${table}" not writable. Allowed: ${WRITABLE_TABLES.join(", ")}` },
                { status: 400 }
            );
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        let result;

        switch (action) {
            case "insert": {
                if (!data) return NextResponse.json({ error: "Missing data" }, { status: 400 });
                const { data: inserted, error } = await supabase.from(table).insert(data).select();
                if (error) throw error;
                result = inserted;
                break;
            }
            case "update": {
                if (!data || !id) return NextResponse.json({ error: "Missing data or id" }, { status: 400 });
                const { data: updated, error } = await supabase.from(table).update(data).eq("id", id).select();
                if (error) throw error;
                result = updated;
                break;
            }
            case "upsert": {
                if (!data) return NextResponse.json({ error: "Missing data" }, { status: 400 });
                const { data: upserted, error } = await supabase.from(table).upsert(data, {
                    onConflict: match || "id",
                }).select();
                if (error) throw error;
                result = upserted;
                break;
            }
            case "delete": {
                if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
                const { error } = await supabase.from(table).delete().eq("id", id);
                if (error) throw error;
                result = { deleted: id };
                break;
            }
            default:
                return NextResponse.json(
                    { error: `Unknown action "${action}". Use: insert, update, upsert, delete` },
                    { status: 400 }
                );
        }

        // Audit log: write to agent_reports as side effect
        try {
            await supabase.from("agent_reports").insert({
                title: `Agent Mutation: ${action} on ${table}`,
                body: JSON.stringify({ action, table, id: id || data?.id }).slice(0, 500),
                report_type: "system",
                severity: "info",
                source_agent: "api",
            });
        } catch {
            // Non-critical: don't fail the mutation if audit logging fails
        }

        return NextResponse.json({ data: result, action, table });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
