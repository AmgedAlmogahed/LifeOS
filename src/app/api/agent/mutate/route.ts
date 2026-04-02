import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

const VALID_TABLES = [
    "accounts", "agent_reports", "assets", "clients", 
    "communication_logs", "context_bundles", "contracts", "delegation_log", 
    "documents", "expenses", "invoices", "leads", "modules", "opportunities", 
    "pipeline_history", "pipeline_tracker", "platforms", "price_offers", 
    "project_frameworks", "project_phases", "project_state_context", 
    "project_templates", "projects", "quote_line_items", "sprints", 
    "task_dependencies", "task_templates", "tasks", "vault_secrets"
];

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get("x-agent-key");
    const agentToken = process.env.AGENT_API_KEY;

    if (!agentToken || authHeader !== agentToken) {
        return NextResponse.json({ error: "Unauthorized Agent Access" }, { status: 401 });
    }

    try {
        const payload = await req.json();
        const { action, table, function: functionName, data, match, params } = payload;

        if (!action || !['insert', 'update', 'upsert', 'rpc'].includes(action)) {
            return NextResponse.json({ error: "Invalid action. Must be insert, update, upsert, or rpc." }, { status: 400 });
        }

        const supabase = createAdminClient();
        let resultData: any = null;

        if (action === 'rpc') {
            if (!functionName) return NextResponse.json({ error: "Missing function name for rpc." }, { status: 400 });
            
            const { data: rpcData, error: rpcErr } = await supabase.rpc(functionName, params || {});
            if (rpcErr) throw rpcErr;
            resultData = rpcData;
        } else {
            if (!table) return NextResponse.json({ error: "Missing table name." }, { status: 400 });
            if (!VALID_TABLES.includes(table)) {
                return NextResponse.json({ error: `Table '${table}' is not allowed for external mutation.` }, { status: 403 });
            }
            if (!data) return NextResponse.json({ error: "Missing data payload." }, { status: 400 });

            if (action === 'insert') {
                const { data: insData, error: insErr } = await supabase.from(table).insert(data).select();
                if (insErr) throw insErr;
                resultData = insData;
            } else if (action === 'update') {
                if (!match) return NextResponse.json({ error: "Missing match criteria for update." }, { status: 400 });
                let query = supabase.from(table).update(data);
                Object.entries(match).forEach(([k, v]) => { query = query.eq(k, v); });
                const { data: updData, error: updErr } = await query.select();
                if (updErr) throw updErr;
                resultData = updData;
            } else if (action === 'upsert') {
                const { data: upsData, error: upsErr } = await supabase.from(table).upsert(data).select();
                if (upsErr) throw upsErr;
                resultData = upsData;
            }
        }

        // Log mutation asynchronously to audit_logs
        await supabase.from("audit_logs").insert({
            action: `agent_mutation_${action}`,
            details: { table, function: functionName, params, match, data_keys: data ? Object.keys(data) : [] },
            source: 'Agent',
            created_at: new Date().toISOString()
        });

        return NextResponse.json({ data: resultData });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
