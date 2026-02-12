import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
    validateAgentAuth,
    agentErrorResponse,
    agentSuccessResponse,
} from "@/lib/agent-auth";

/**
 * POST /api/agent/sync
 *
 * The main sync endpoint for Son of Anton agent.
 * Accepts batch operations for audit logs, project updates, and task syncs.
 *
 * Body schema:
 * {
 *   audit_logs?: Array<{ level, message, source }>
 *   project_updates?: Array<{ id, progress?, status?, last_audit_at? }>
 *   task_updates?: Array<{ id, status?, priority?, metadata? }>
 * }
 */
export async function POST(request: NextRequest) {
    // ─── Auth Check ──────────────────────────────────────────────────────────────
    const auth = validateAgentAuth(request);
    if (!auth.valid) {
        return agentErrorResponse(auth.error!, 401);
    }

    try {
        const body = await request.json();
        const supabase = createAdminClient();
        const results: Record<string, unknown> = {};

        // ─── Push Audit Logs ─────────────────────────────────────────────────────
        if (body.audit_logs && Array.isArray(body.audit_logs)) {
            const { data, error } = await supabase
                .from("audit_logs")
                .insert(body.audit_logs)
                .select();

            if (error) {
                results.audit_logs = { error: error.message };
            } else {
                results.audit_logs = { inserted: data.length };
            }
        }

        // ─── Update Project Progress ─────────────────────────────────────────────
        if (body.project_updates && Array.isArray(body.project_updates)) {
            const updateResults = [];
            for (const update of body.project_updates) {
                const { id, ...fields } = update;
                const { error } = await supabase
                    .from("projects")
                    .update(fields)
                    .eq("id", id);

                updateResults.push({
                    id,
                    success: !error,
                    error: error?.message,
                });
            }
            results.project_updates = updateResults;
        }

        // ─── Sync Task Statuses ──────────────────────────────────────────────────
        if (body.task_updates && Array.isArray(body.task_updates)) {
            const updateResults = [];
            for (const update of body.task_updates) {
                const { id, ...fields } = update;
                const { error } = await supabase
                    .from("tasks")
                    .update(fields)
                    .eq("id", id);

                updateResults.push({
                    id,
                    success: !error,
                    error: error?.message,
                });
            }
            results.task_updates = updateResults;
        }

        return agentSuccessResponse({
            message: "Sync completed",
            results,
        });
    } catch (error) {
        console.error("[Agent Sync Error]", error);
        return agentErrorResponse("Internal sync error", 500);
    }
}

/**
 * GET /api/agent/sync
 *
 * Returns current system state for the agent to pull.
 */
export async function GET(request: NextRequest) {
    const auth = validateAgentAuth(request);
    if (!auth.valid) {
        return agentErrorResponse(auth.error!, 401);
    }

    try {
        const supabase = createAdminClient();

        const [projectsRes, tasksRes, configRes] = await Promise.all([
            supabase.from("projects").select("*").order("updated_at", { ascending: false }),
            supabase.from("tasks").select("*").order("updated_at", { ascending: false }),
            supabase.from("system_config").select("*"),
        ]);

        return agentSuccessResponse({
            projects: projectsRes.data ?? [],
            tasks: tasksRes.data ?? [],
            config: configRes.data ?? [],
        });
    } catch (error) {
        console.error("[Agent Sync GET Error]", error);
        return agentErrorResponse("Internal error", 500);
    }
}
