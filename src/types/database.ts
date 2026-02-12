// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  VENTURE OS — Database Types v4.0 (Auto-Generated Foundation)              ║
// ╠══════════════════════════════════════════════════════════════════════════════╣
// ║  The canonical Database type is auto-generated in ./supabase.ts.            ║
// ║  This file re-exports it and provides convenience aliases.                  ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

// ─── Re-export the canonical Database type ──────────────────────────────────
export type { Database } from "./supabase";
export type { Json } from "./supabase";
export type { Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes } from "./supabase";

// ─── Convenience Enum Types ────────────────────────────────────────────────
export type ProjectStatus = "Backlog" | "Understand" | "Document" | "Freeze" | "Implement" | "Verify";
export type TaskStatus = "Todo" | "In Progress" | "Done" | "Blocked";
export type TaskPriority = "Critical" | "High" | "Medium" | "Low";
export type TaskType = "Architectural" | "Implementation" | "Audit" | "Maintenance";
export type AuditLevel = "Critical" | "Warning" | "Info";
export type AssetType = "github" | "figma" | "supabase" | "docs" | "other";

export type OpportunityStage = "Draft" | "Price Offer Sent" | "Negotiating" | "Won" | "Lost";
export type ServiceType = "Cloud" | "Web" | "Design" | "Marketing";
export type OfferStatus = "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired";
export type ContractStatus = "Draft" | "Pending Signature" | "Active" | "Completed" | "Terminated";
export type LifecycleStage = "Requirements" | "Building" | "Testing" | "Deploying" | "Maintenance";
export type DeployEnv = "Vercel" | "Railway" | "Alibaba" | "AWS" | "Other";
export type ProjectCategory = "Business" | "Personal" | "Social" | "Research";
export type TaskCategory = "Business" | "Personal" | "Social" | "Research" | "Habit";
export type InvoiceStatus = "Pending" | "Paid" | "Overdue" | "Cancelled";
export type PaymentMethod = "Transfer" | "Card" | "Cash";
export type AmendmentStatus = "Draft" | "Signed";
export type CommChannel = "WhatsApp" | "Email" | "Call" | "Meeting";
export type CaptureSource = "web" | "telegram" | "voice" | "agent";
export type CaptureStatus = "captured" | "processed" | "dismissed";
export type HealthDimension = "financial" | "business" | "operations" | "personal";

// ─── Row Type Aliases (from generated Tables helper) ────────────────────────
import type { Tables as T, TablesInsert as TI, TablesUpdate as TU } from "./supabase";

// Core entities
export type Client = T<"clients">;
export type Opportunity = T<"opportunities">;
export type PriceOffer = T<"price_offers">;
export type Contract = T<"contracts">;
export type Project = T<"projects">;
export type ProjectAsset = T<"project_assets">;
export type Task = T<"tasks">;
export type AuditLog = T<"audit_logs">;
export type SystemConfig = T<"system_config">;
export type GuardianRule = T<"guardian_rules">;
export type VaultSecret = T<"vault_secrets">;
export type LeverageLog = T<"leverage_logs">;
export type Lifecycle = T<"lifecycles">;
export type Deployment = T<"deployments">;
export type AgentReport = T<"agent_reports">;
export type ServiceCatalogItem = T<"service_catalog">;
export type Invoice = T<"invoices">;
export type Payment = T<"payments">;
export type ContractAmendment = T<"contract_amendments">;
export type MeetingMinutes = T<"meeting_minutes">;
export type CommunicationLog = T<"communication_logs">;

// Phase 1 UX entities
export type FocusSession = T<"focus_sessions">;
export type DailyPlan = T<"daily_plans">;
export type QuickCapture = T<"quick_captures">;
export type HealthSnapshot = T<"health_snapshots">;

// ─── Insert Type Aliases ────────────────────────────────────────────────────
export type ClientInsert = TI<"clients">;
export type OpportunityInsert = TI<"opportunities">;
export type PriceOfferInsert = TI<"price_offers">;
export type ContractInsert = TI<"contracts">;
export type ProjectInsert = TI<"projects">;
export type TaskInsert = TI<"tasks">;
export type AuditLogInsert = TI<"audit_logs">;
export type GuardianRuleInsert = TI<"guardian_rules">;
export type FocusSessionInsert = TI<"focus_sessions">;
export type DailyPlanInsert = TI<"daily_plans">;
export type QuickCaptureInsert = TI<"quick_captures">;
export type HealthSnapshotInsert = TI<"health_snapshots">;
export type InvoiceInsert = TI<"invoices">;
export type PaymentInsert = TI<"payments">;
export type ContractAmendmentInsert = TI<"contract_amendments">;
export type MeetingMinutesInsert = TI<"meeting_minutes">;
export type CommunicationLogInsert = TI<"communication_logs">;

// ─── Update Type Aliases ────────────────────────────────────────────────────
export type ClientUpdate = TU<"clients">;
export type OpportunityUpdate = TU<"opportunities">;
export type ProjectUpdate = TU<"projects">;
export type TaskUpdate = TU<"tasks">;
export type FocusSessionUpdate = TU<"focus_sessions">;
export type DailyPlanUpdate = TU<"daily_plans">;
export type QuickCaptureUpdate = TU<"quick_captures">;
export type InvoiceUpdate = TU<"invoices">;
export type PaymentUpdate = TU<"payments">;
export type ContractAmendmentUpdate = TU<"contract_amendments">;
export type MeetingMinutesUpdate = TU<"meeting_minutes">;
export type CommunicationLogUpdate = TU<"communication_logs">;

// ─── Composite Types ────────────────────────────────────────────────────────

export interface PriceOfferItem {
    name: string;
    service_type: ServiceType;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
}

export interface StageHistoryEntry {
    stage: LifecycleStage;
    entered_at: string;
    exited_at?: string;
}
