import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { validateAgentAuth, agentSuccessResponse, agentErrorResponse } from "@/lib/agent-auth";

export async function POST(req: NextRequest) {
    const auth = validateAgentAuth(req);
    if (!auth.valid) return agentErrorResponse(auth.error!, 401);

    try {
        const { action } = await req.json();
        const supabase = createAdminClient();

        if (action === "clear") {
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

            return agentSuccessResponse({ message: "Workspace cleared." });
        }

        if (action === "initialize_nukhbat") {
            // 1. Create Nukhbat Project
            const { data: project, error: pErr } = await supabase
                .from("projects")
                .insert({
                    name: "Nukhbat Al-Mabani",
                    status: "Understand",
                    progress: 40,
                    category: "Business",
                    specs_md: "# Nukhbat Al-Mabani Architecture\n- **Stack:** Next.js 14, NestJS, Prisma, PostgreSQL, Nx, CASL.\n- **Portals:** Admin, Owner, Technician, Contractor (Pending).\n- **Scale:** ~178 Endpoints, ~54 Entities.\n\n## Critical Requirements\n- 48-hour auto-release of units.\n- Mandatory ratings & GPS check-ins for technicians.\n- OTP-based closure for maintenance tasks.\n- CASL for hybrid RBAC+ABAC."
                })
                .select()
                .single();

            if (pErr) throw pErr;

            // 2. Add Known Tasks
            const tasks = [
                {
                    project_id: project.id,
                    title: "Resolve Identity Fragmentation (User/Employee/CmsUser)",
                    priority: "Critical",
                    status: "Todo",
                    type: "Architectural",
                    agent_context: { issue: "Separate tables for portals block global CASL and cross-portal auditing." }
                },
                {
                    project_id: project.id,
                    title: "Implement Missing Audit Fields (LandPiece, Building, Unit)",
                    priority: "High",
                    status: "Todo",
                    type: "Maintenance",
                    agent_context: { issue: "Tables missing createdById for audit trails." }
                },
                {
                    project_id: project.id,
                    title: "Review 48-hour Auto-Release Logic",
                    priority: "Medium",
                    status: "Todo",
                    type: "Audit",
                    agent_context: { goal: "Ensure unit release trigger is robust and tested." }
                },
                {
                    project_id: project.id,
                    title: "GPS & Rating Validation for Technician Portal",
                    priority: "High",
                    status: "Todo",
                    type: "Implementation",
                    agent_context: { req: "Mandatory check-in validation before task closure." }
                }
            ];

            const { error: tErr } = await supabase.from("tasks").insert(tasks);
            if (tErr) throw tErr;

            return agentSuccessResponse({ message: "Nukhbat Al-Mabani project and tasks initialized.", project_id: project.id });
        }

        return agentErrorResponse("Invalid action.");
    } catch (error: any) {
        return agentErrorResponse(error.message, 500);
    }
}
