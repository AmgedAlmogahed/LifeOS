"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  VENTURE OS — Automator Engine                                             ║
// ║  Business rule triggers that chain actions automatically.                  ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

type TriggerType = "offer_accepted" | "opportunity_won" | "contract_activated";

export async function runAutomator(trigger: TriggerType, entity: Record<string, unknown>) {
    const supabase = createAdminClient();

    switch (trigger) {
        // ─── Offer Accepted → Auto-Draft Contract ─────────────────────────────────
        case "offer_accepted": {
            const offer = entity as any;
            const title = `Contract — ${offer.title}`;

            const { data: contract, error } = await (supabase.from("contracts") as any).insert({
                client_id: offer.client_id,
                opportunity_id: offer.opportunity_id ?? null,
                price_offer_id: offer.id,
                title,
                status: "Draft",
                pdf_url: "",
                total_value: offer.total_value ?? 0,
                start_date: null,
                end_date: null,
                terms_md: generateContractTerms(offer),
            }).select().single();

            // Audit log
            await (supabase.from("audit_logs") as any).insert({
                level: "Info",
                message: `⚡ Automator: Draft contract "${title}" created from accepted offer (${formatCurrency(offer.total_value)})`,
                source: "automator",
                project_id: null,
            });

            // Agent report
            await (supabase.from("agent_reports") as any).insert({
                client_id: offer.client_id,
                report_type: "automator_action",
                title: "Contract Auto-Drafted",
                body: `Offer "${offer.title}" was accepted. A draft contract has been automatically created with value ${formatCurrency(offer.total_value)}. Review and finalize the contract terms.`,
                severity: "info",
                is_resolved: false,
            });

            revalidatePath("/vault");
            return { contract_id: contract?.id };
        }

        // ─── Opportunity Won → Auto-Init Project ──────────────────────────────────
        case "opportunity_won": {
            const opp = entity as any;
            const projectName = `${opp.title} — Build`;

            // Create project
            const { data: project, error } = await (supabase.from("projects") as any).insert({
                name: projectName,
                description: `Auto-initialized from won opportunity: ${opp.title}`,
                status: "Understand",
                progress: 0,
                is_frozen: false,
                specs_md: "",
                client_id: opp.client_id,
                contract_id: null,
                service_type: opp.service_type ?? null,
            }).select().single();

            // Create lifecycle
            if (project) {
                await (supabase.from("lifecycles") as any).insert({
                    project_id: project.id,
                    current_stage: "Requirements",
                    stage_history: [{ stage: "Requirements", entered_at: new Date().toISOString() }],
                    started_at: new Date().toISOString(),
                });
            }

            // Audit log
            await (supabase.from("audit_logs") as any).insert({
                level: "Info",
                message: `⚡ Automator: Project "${projectName}" initialized from won opportunity (${formatCurrency(opp.estimated_value)})`,
                source: "automator",
                project_id: project?.id ?? null,
            });

            // Agent report
            await (supabase.from("agent_reports") as any).insert({
                client_id: opp.client_id,
                project_id: project?.id ?? null,
                report_type: "automator_action",
                title: "Project Auto-Initialized",
                body: `Opportunity "${opp.title}" was marked as Won. A new project has been created in "Understand" phase with a Requirements lifecycle stage. Next: define specs and scope.`,
                severity: "info",
                is_resolved: false,
            });

            revalidatePath("/forge");
            revalidatePath("/pipeline");
            return { project_id: project?.id };
        }

        // ─── Contract Activated → Celebration Log ─────────────────────────────────
        case "contract_activated": {
            const contract = entity as any;

            // Audit log
            await (supabase.from("audit_logs") as any).insert({
                level: "Info",
                message: `🎉 Automator: Contract "${contract.title}" is now ACTIVE (${formatCurrency(contract.total_value)}). Revenue locked.`,
                source: "automator",
                project_id: null,
            });

            // Agent report
            await (supabase.from("agent_reports") as any).insert({
                client_id: contract.client_id,
                report_type: "automator_action",
                title: "Contract Activated — Revenue Locked",
                body: `Contract "${contract.title}" has been activated with total value ${formatCurrency(contract.total_value)}. This revenue is now reflected in active contract metrics.`,
                severity: "info",
                is_resolved: false,
            });

            // Update client health boost
            try {
                const { data: clientData } = await (supabase.from("clients") as any).select("health_score").eq("id", contract.client_id).single();
                if (clientData) {
                    const newScore = Math.min(100, (clientData.health_score ?? 75) + 5);
                    await (supabase.from("clients") as any).update({ health_score: newScore }).eq("id", contract.client_id);
                }
            } catch { /* silent fail */ }

            revalidatePath("/vault");
            revalidatePath("/clients");
            return {};
        }

        default:
            return {};
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(v: number): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v ?? 0);
}

function generateContractTerms(offer: any): string {
    const items = (offer.items ?? []) as any[];
    const lineItems = items.map((i: any, idx: number) =>
        `${idx + 1}. **${i.name}** — ${i.description ?? ""}\n   - Qty: ${i.quantity} × ${formatCurrency(i.unit_price)} = ${formatCurrency(i.total)}`
    ).join("\n\n");

    return `# Contract Terms — ${offer.title}

## Scope of Work

${lineItems || "_No line items specified._"}

## Total Value

**${formatCurrency(offer.total_value)}**

## Payment Terms

- 30% upon contract signing
- 40% upon milestone delivery
- 30% upon final acceptance

## Timeline

_To be determined upon project kickoff._

## Notes

${offer.notes || "_No additional notes._"}

---
_Auto-generated by Venture OS Automator Engine_
_${new Date().toISOString().split("T")[0]}_
`;
}
