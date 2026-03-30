import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const AGENT_API_KEY = process.env.AGENT_API_KEY || "lifeos-agent-key-change-me";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function authenticate(req: NextRequest): boolean {
    const key = req.headers.get("x-agent-key");
    return key === AGENT_API_KEY;
}

/**
 * Context Recovery Bundle: returns everything an agent needs to resume work on a project.
 * GET /api/agent/state?project_id=<id>
 */
export async function GET(req: NextRequest) {
    if (!authenticate(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = req.nextUrl.searchParams.get("project_id");
    if (!projectId) {
        return NextResponse.json({ error: "Missing project_id query parameter" }, { status: 400 });
    }

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        const [
            projectRes,
            tasksRes,
            sprintsRes,
            contextRes,
            snapshotsRes,
            delegationRes,
            milestonesRes,
        ] = await Promise.all([
            // Project info
            supabase.from("projects").select("*, clients(name, email, health_score)").eq("id", projectId).single(),
            // Active tasks
            supabase.from("tasks").select("id, title, status, priority, due_date, sprint_id, energy_level, estimated_minutes, agent_assignable")
                .eq("project_id", projectId)
                .neq("status", "Done")
                .order("priority", { ascending: true })
                .limit(50),
            // Current sprints
            supabase.from("sprints").select("*")
                .eq("project_id", projectId)
                .order("sprint_number", { ascending: true }),
            // Project state context
            supabase.from("project_state_context").select("*")
                .eq("project_id", projectId)
                .maybeSingle(),
            // Recent snapshots
            supabase.from("state_snapshots").select("*")
                .eq("project_id", projectId)
                .order("created_at", { ascending: false })
                .limit(5),
            // Active delegations
            supabase.from("delegation_log").select("*, tasks(title, status)")
                .eq("tasks.project_id", projectId)
                .in("status", ["pending", "in_progress"])
                .order("delegated_at", { ascending: false })
                .limit(10),
            // Milestones
            supabase.from("milestones").select("*")
                .eq("project_id", projectId)
                .order("deadline", { ascending: true }),
        ]);

        // Compute summary stats
        const allTasks = tasksRes.data || [];
        const stats = {
            total_active_tasks: allTasks.length,
            by_status: allTasks.reduce((acc: Record<string, number>, t: any) => {
                acc[t.status] = (acc[t.status] || 0) + 1;
                return acc;
            }, {}),
            agent_assignable: allTasks.filter((t: any) => t.agent_assignable).length,
            blocked: allTasks.filter((t: any) => t.status === "Blocked").length,
        };

        return NextResponse.json({
            project: projectRes.data,
            context: contextRes.data,
            tasks: tasksRes.data,
            sprints: sprintsRes.data,
            snapshots: snapshotsRes.data,
            delegations: delegationRes.data,
            milestones: milestonesRes.data,
            stats,
            _timestamp: new Date().toISOString(),
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
