import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

const VALID_TABLES = [
    "accounts", "agent_reports", "assets", "audit_logs", "clients", 
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
        const { table, filters, limit, order } = payload;

        if (!table) {
            return NextResponse.json({ error: "Target table must be provided" }, { status: 400 });
        }

        if (!VALID_TABLES.includes(table)) {
            return NextResponse.json({ error: `Table '${table}' is not allowed for external querying.` }, { status: 403 });
        }

        const supabase = createAdminClient();
        let query = supabase.from(table).select("*");
        
        if (filters && typeof filters === 'object') {
            Object.entries(filters).forEach(([col, val]) => {
                query = query.eq(col, val);
            });
        }

        if (order && typeof order === 'object' && order.column) {
            query = query.order(order.column, { ascending: order.ascending ?? true });
        }

        if (typeof limit === 'number') {
            query = query.limit(limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        return NextResponse.json({ data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
