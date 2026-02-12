import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
    validateAgentAuth,
    agentErrorResponse,
    agentSuccessResponse,
} from "@/lib/agent-auth";

/**
 * POST /api/os/sync
 *
 * Token-Saver Sync Protocol for Son of Anton.
 * Accepts batch operations for the entire Venture OS domain.
 *
 * Body schema:
 * {
 *   audit_logs?: Array<{ level, message, source, project_id? }>
 *   project_updates?: Array<{ id, progress?, status?, last_audit_at? }>
 *   task_updates?: Array<{ id, status?, priority?, metadata?, agent_context? }>
 *   client_health?: Array<{ id, health_score, reason? }>
 *   agent_reports?: Array<{ client_id?, project_id?, report_type, title, body, severity }>
 *   deployment_status?: Array<{ id?, project_id, environment, label, url?, status, metadata? }>
 *   opportunity_updates?: Array<{ id, stage?, probability?, estimated_value? }>
 * }
 */
import { runAutomator } from "@/lib/actions/automator";

// ... existing imports ...

export async function POST(request: NextRequest) {
    const auth = validateAgentAuth(request);
    if (!auth.valid) return agentErrorResponse(auth.error!, 401);

    try {
        const body = await request.json();
        const supabase = createAdminClient();
        const results: Record<string, unknown> = {};

        // ─── Audit Logs ──────────────────────────────────────────────────────────
        if (body.audit_logs?.length) {
            const { data, error } = await (supabase.from("audit_logs") as any).insert(body.audit_logs).select();
            results.audit_logs = error ? { error: error.message } : { inserted: data.length };
        }

        // ─── Project Updates ─────────────────────────────────────────────────────
        if (body.project_updates?.length) {
            const r = [];
            for (const u of body.project_updates) {
                const { id, ...fields } = u;
                const { error } = await (supabase.from("projects") as any).update(fields).eq("id", id);
                r.push({ id, success: !error, error: error?.message });
            }
            results.project_updates = r;
        }

        // ─── Task Updates ────────────────────────────────────────────────────────
        if (body.task_updates?.length) {
            const r = [];
            for (const u of body.task_updates) {
                const { id, ...fields } = u;
                const { error } = await (supabase.from("tasks") as any).update(fields).eq("id", id);
                r.push({ id, success: !error, error: error?.message });
            }
            results.task_updates = r;
        }

        // ─── Client Health Score ─────────────────────────────────────────────────
        if (body.client_health?.length) {
            const r = [];
            for (const u of body.client_health) {
                const { id, health_score, reason } = u;
                const { error } = await (supabase.from("clients") as any).update({ health_score }).eq("id", id);
                if (!error && reason) {
                    await (supabase.from("agent_reports") as any).insert({
                        client_id: id,
                        report_type: "health_adjustment",
                        title: `Health score → ${health_score}%`,
                        body: reason,
                        severity: health_score < 50 ? "critical" : health_score < 75 ? "warning" : "info",
                    });
                }
                r.push({ id, success: !error, error: error?.message });
            }
            results.client_health = r;
        }

        // ─── Agent Reports ───────────────────────────────────────────────────────
        if (body.agent_reports?.length) {
            const { data, error } = await (supabase.from("agent_reports") as any).insert(body.agent_reports).select();
            results.agent_reports = error ? { error: error.message } : { inserted: data.length };
        }

        // ─── Deployment Status ───────────────────────────────────────────────────
        if (body.deployment_status?.length) {
            const r = [];
            for (const d of body.deployment_status) {
                if (d.id) {
                    const { error } = await (supabase.from("deployments") as any)
                        .update({ status: d.status, last_checked_at: new Date().toISOString(), metadata: d.metadata })
                        .eq("id", d.id);
                    r.push({ id: d.id, success: !error, error: error?.message });
                } else {
                    const { data, error } = await (supabase.from("deployments") as any).upsert({
                        project_id: d.project_id,
                        environment: d.environment,
                        label: d.label,
                        url: d.url ?? "",
                        status: d.status,
                        last_checked_at: new Date().toISOString(),
                        metadata: d.metadata ?? {},
                    }).select();
                    r.push({ success: !error, inserted: data?.length, error: error?.message });
                }
            }
            results.deployment_status = r;
        }

        // ─── Opportunity Updates (w/ Automator) ──────────────────────────────────
        if (body.opportunity_updates?.length) {
            const r = [];
            for (const u of body.opportunity_updates) {
                const { id, ...fields } = u;
                if (fields.stage === "Won") fields.won_at = new Date().toISOString();

                const { error } = await (supabase.from("opportunities") as any).update(fields).eq("id", id);

                if (!error && fields.stage === "Won") {
                    const { data: opp } = await (supabase.from("opportunities") as any).select("*").eq("id", id).single();
                    if (opp) await runAutomator("opportunity_won", opp);
                }
                r.push({ id, success: !error, error: error?.message });
            }
            results.opportunity_updates = r;
        }

        // ─── Price Offer Updates (w/ Automator) ──────────────────────────────────
        if (body.offer_updates?.length) {
            const r = [];
            for (const u of body.offer_updates) {
                const { id, ...fields } = u;
                const { error } = await (supabase.from("price_offers") as any).update(fields).eq("id", id);

                if (!error && fields.status === "Accepted") {
                    const { data: offer } = await (supabase.from("price_offers") as any).select("*").eq("id", id).single();
                    if (offer) await runAutomator("offer_accepted", offer);
                }
                r.push({ id, success: !error, error: error?.message });
            }
            results.offer_updates = r;
        }

        // ─── Contract Updates (w/ Automator) ─────────────────────────────────────
        if (body.contract_updates?.length) {
            const r = [];
            for (const u of body.contract_updates) {
                const { id, ...fields } = u;
                const { error } = await (supabase.from("contracts") as any).update(fields).eq("id", id);

                if (!error && fields.status === "Active") {
                    const { data: contract } = await (supabase.from("contracts") as any).select("*").eq("id", id).single();
                    if (contract) await runAutomator("contract_activated", contract);
                }
                r.push({ id, success: !error, error: error?.message });
            }
            results.contract_updates = r;
        }

        return agentSuccessResponse({ message: "Sync completed", results });
    } catch (error) {
        console.error("[OS Sync Error]", error);
        return agentErrorResponse("Internal sync error", 500);
    }
}

/**
 * GET /api/os/sync
 *
 * Returns the full system state for Son of Anton to pull.
 * High-density payload — all entities in a single call.
 */
export async function GET(request: NextRequest) {
    const auth = validateAgentAuth(request);
    if (!auth.valid) return agentErrorResponse(auth.error!, 401);

    try {
        const supabase = createAdminClient();

        const [clientsRes, oppsRes, contractsRes, projectsRes, tasksRes, deploymentsRes, configRes] = await Promise.all([
            supabase.from("clients").select("*").order("name"),
            supabase.from("opportunities").select("*").order("updated_at", { ascending: false }),
            supabase.from("contracts").select("*").eq("status", "Active"),
            supabase.from("projects").select("*").order("updated_at", { ascending: false }),
            supabase.from("tasks").select("*").order("updated_at", { ascending: false }),
            supabase.from("deployments").select("*"),
            supabase.from("system_config").select("*"),
        ]);

        return agentSuccessResponse({
            clients: clientsRes.data ?? [],
            opportunities: oppsRes.data ?? [],
            active_contracts: contractsRes.data ?? [],
            projects: projectsRes.data ?? [],
            tasks: tasksRes.data ?? [],
            deployments: deploymentsRes.data ?? [],
            config: configRes.data ?? [],
        });
    } catch (error) {
        console.error("[OS Sync GET Error]", error);
        return agentErrorResponse("Internal error", 500);
    }
}
