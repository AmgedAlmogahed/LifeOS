import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { validateAgentAuth } from "@/lib/agent-auth";

/**
 * POST /api/agent/seed
 * Body: { action: "clear" | "seed" }
 */
export async function POST(req: NextRequest) {
    const auth = validateAgentAuth(req);
    if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 });

    try {
        const { action } = await req.json();
        const supabase = createAdminClient();

        if (action === "clear") {
            // Delete in order of dependencies
            await supabase.from("leverage_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
            await supabase.from("audit_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
            await supabase.from("tasks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
            await supabase.from("project_assets").delete().neq("id", "00000000-0000-0000-0000-000000000000");
            await supabase.from("deployments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
            await supabase.from("lifecycles").delete().neq("id", "00000000-0000-0000-0000-000000000000");
            await supabase.from("projects").delete().neq("id", "00000000-0000-0000-0000-000000000000");
            await supabase.from("contracts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
            await supabase.from("price_offers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
            await supabase.from("opportunities").delete().neq("id", "00000000-0000-0000-0000-000000000000");
            await supabase.from("clients").delete().neq("id", "00000000-0000-0000-0000-000000000000");

            return NextResponse.json({ success: true, message: "Workspace cleared." });
        }

        return NextResponse.json({ success: false, message: "Invalid action." });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

/**
 * GET remains for dummy seeding if needed manually
 */
export async function GET(req: NextRequest) {
    // Keep your existing GET logic here if you want it as a fallback
    return NextResponse.json({ message: "Use POST with action: 'clear' to wipe data." });
}
