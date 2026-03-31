import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Dedicated backend client to bypass RLS for systemic agent actions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    const agentToken = process.env.AGENT_API_KEY;

    // Validate the external orchestration agent's authorization
    if (!agentToken || authHeader !== `Bearer ${agentToken}`) {
        return NextResponse.json({ error: "Unauthorized Agent Access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("project_id");

    try {
        if (projectId) {
            // Retrieve unified state context for a specific project
            const { data, error } = await supabase
                .from("project_state_context")
                .select("*")
                .eq("project_id", projectId)
                .single();

            if (error) throw error;
            return NextResponse.json({ data });
        } else {
            // Retrieve global cross-project state context
            const { data, error } = await supabase
                .from("project_state_context")
                .select("project_id, context_summary, last_decision");

            if (error) throw error;
            return NextResponse.json({ data });
        }
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
