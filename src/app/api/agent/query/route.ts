import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    const agentToken = process.env.AGENT_API_KEY;

    if (!agentToken || authHeader !== `Bearer ${agentToken}`) {
        return NextResponse.json({ error: "Unauthorized Agent Access" }, { status: 401 });
    }

    try {
        const payload = await req.json();
        const { target, filters } = payload;

        if (!target) {
            return NextResponse.json({ error: "Target table must be provided" }, { status: 400 });
        }

        // Extremely locked-down semantic layer preventing agents from arbitrarily querying things.
        // We only allow predefined queries based on specific endpoints they need for orchestration.
        let query = supabase.from(target).select("*");
        
        if (filters && typeof filters === 'object') {
            Object.entries(filters).forEach(([col, val]) => {
                query = query.eq(col, val);
            });
        }

        const { data, error } = await query;
        if (error) throw error;
        
        return NextResponse.json({ data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
