import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const AGENT_API_KEY = process.env.AGENT_API_KEY || "lifeos-agent-key-change-me";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Allowlisted tables that agents can query
const ALLOWED_TABLES = [
    "projects", "tasks", "clients", "invoices", "focus_sessions",
    "daily_plans", "sprints", "milestones", "opportunities", "contracts",
    "delegation_log", "project_state_context", "state_snapshots",
    "agent_reports", "expenses", "recurring_expenses", "bank_transactions",
    "scope_nodes", "tax_records",
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
        const { table, columns = "*", filters = {}, limit = 50, order } = body;

        if (!table || !ALLOWED_TABLES.includes(table)) {
            return NextResponse.json(
                { error: `Table "${table}" not allowed. Allowed: ${ALLOWED_TABLES.join(", ")}` },
                { status: 400 }
            );
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        let query = supabase.from(table).select(columns).limit(limit);

        // Apply filters: { column: value } or { column: { op: "gt", value: 10 } }
        for (const [col, val] of Object.entries(filters)) {
            if (typeof val === "object" && val !== null && "op" in (val as any)) {
                const { op, value } = val as { op: string; value: any };
                switch (op) {
                    case "eq": query = query.eq(col, value); break;
                    case "neq": query = query.neq(col, value); break;
                    case "gt": query = query.gt(col, value); break;
                    case "gte": query = query.gte(col, value); break;
                    case "lt": query = query.lt(col, value); break;
                    case "lte": query = query.lte(col, value); break;
                    case "like": query = query.like(col, value); break;
                    case "in": query = query.in(col, value); break;
                    case "is": query = query.is(col, value); break;
                    default:
                        return NextResponse.json({ error: `Unknown operator: ${op}` }, { status: 400 });
                }
            } else {
                query = query.eq(col, val);
            }
        }

        if (order) {
            const { column, ascending = true } = order;
            query = query.order(column, { ascending });
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data, count: data?.length ?? 0 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
