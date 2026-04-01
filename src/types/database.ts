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

import type { Json } from "./supabase";

// ─── Convenience Enum Types ────────────────────────────────────────────────
export type ProjectStatus = "Backlog" | "Understand" | "Document" | "Freeze" | "Implement" | "Verify";
export type TaskStatus = "Todo" | "In Progress" | "Done" | "Blocked" | "Cancelled";
export type TaskPriority = "Critical" | "High" | "Medium" | "Low";
export type TaskType = "Architectural" | "Implementation" | "Audit" | "Maintenance";
export type AuditLevel = "Critical" | "Warning" | "Info";
export type AssetType = "github" | "figma" | "supabase" | "docs" | "other";

// Module Architecture enums
export type PhaseStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED";
export type ModuleStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
export type WorkType = "Backend" | "Frontend" | "Design" | "Integration" | "DevOps" | "Testing" | "Audit";

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

// New enum types for added tables
export type EnergyLevel = "deep" | "shallow" | "admin";
export type ExpenseCategory = "Infrastructure" | "Tools" | "Subscriptions" | "Office" | "Travel" | "Contractor" | "Marketing" | "Legal" | "Other";
export type DelegationStatus = "pending" | "in_progress" | "completed" | "failed";
export type RecurringFrequency = "weekly" | "monthly" | "quarterly" | "yearly";
export type TaxRecordStatus = "draft" | "filed" | "paid";
export type TransactionDirection = "inflow" | "outflow";
export type TimeBlockType = "focus" | "admin" | "break";
export type StateSnapshotTrigger = "focus_exit" | "daily_review" | "manual";
export type LeadChannel = "CH-REF" | "CH-SOC" | "CH-WEB" | "CH-MAP" | "CH-AI" | "CH-OUT";
export type LeadStatus = "INCOMING" | "CONTACTED" | "QUALIFIED" | "DISQUALIFIED" | "CONVERTED";
export type LeadPriority = "Normal" | "High" | "Urgent";

// ─── Row Type Aliases (from generated Tables helper) ────────────────────────
import type { Tables as T, TablesInsert as TI, TablesUpdate as TU } from "./supabase";

// Core entities
export type Client = T<"clients">;
export type Opportunity = T<"opportunities">;
export type PriceOffer = T<"price_offers">;
export type Contract = T<"contracts">;
export type Project = T<"projects">;
export type Sprint = T<"sprints">;
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


// Domain Restructure entities
export type Account = T<"accounts">;
export type Platform = T<"platforms">;
export type Asset = T<"assets">;
export type Document = T<"documents">;
export type Milestone = T<"milestones">;
export type Module = T<"modules">;


// Removed obsolete Module Architecture entities

// Phase 1 UX entities
export type FocusSession = T<"focus_sessions">;
export type DailyPlan = T<"daily_plans">;
export type QuickCapture = T<"quick_captures">;
export type HealthSnapshot = T<"health_snapshots">;

// ─── Manual Interfaces for New Tables (not yet in generated supabase.ts) ─────

export interface ProjectStateContext {
  id: string;
  project_id: string;
  context_summary: string;
  current_blockers: string[];
  last_decision: string;
  next_action: string;
  updated_at: string;
}

export interface StateSnapshot {
  id: string;
  project_id: string;
  snapshot_text: string;
  trigger: StateSnapshotTrigger;
  created_at: string;
}

export interface ProjectTemplatePhaseTask {
  title: string;
  type: TaskType;
  priority: TaskPriority;
  energy_level: EnergyLevel;
  estimated_minutes: number;
  dev_type?: string;
  description?: string;
}

export interface ProjectTemplatePhase {
  name: string;
  order: number;
  tasks: ProjectTemplatePhaseTask[];
}

export interface ProjectTemplate {
  id: string;
  category: ProjectCategory | string;
  name: string;
  description: string;
  phases: ProjectTemplatePhase[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DelegationLogEntry {
  id: string;
  task_id: string;
  agent_id: string;
  delegated_at: string;
  status: DelegationStatus;
  result_summary: string | null;
  completed_at: string | null;
}

export interface Expense {
  id: string;
  project_id: string | null;
  description: string;
  amount: number;
  vat_amount: number;
  category: ExpenseCategory;
  receipt_url: string;
  vendor_name: string;
  expense_date: string;
  is_recurring: boolean;
  recurring_expense_id: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  vat_amount: number;
  category: ExpenseCategory;
  frequency: RecurringFrequency;
  vendor_name: string;
  next_due_date: string | null;
  is_active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface TaxRecord {
  id: string;
  period_start: string;
  period_end: string;
  vat_collected: number;
  vat_paid: number;
  net_vat_liability: number;
  status: TaxRecordStatus;
  filing_reference: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface BankTransaction {
  id: string;
  transaction_date: string;
  amount: number;
  direction: TransactionDirection;
  description: string;
  reference: string;
  matched_invoice_id: string | null;
  matched_expense_id: string | null;
  is_reconciled: boolean;
  reconciled_at: string | null;
  notes: string;
  created_at: string;
}

export interface TimeBlock {
  start: string;
  end: string;
  task_id: string | null;
  type: TimeBlockType;
}

export interface EnergyCurve {
  morning: number;
  afternoon: number;
  evening: number;
}

// Extended field types for Task (columns exist in DB but not in generated types)
export interface TaskExtended extends Task {
  energy_level?: EnergyLevel;
  estimated_minutes?: number | null;
  agent_assignable?: boolean;
  assigned_agent?: string | null;
  start_date?: string | null;
}

// Extended field types for DailyPlan (columns exist in DB but not in generated types)
export interface DailyPlanExtended extends DailyPlan {
  time_blocks?: TimeBlock[] | null;
  energy_curve?: EnergyCurve | null;
  plan_version?: number;
}

export interface Lead {
  id: string;
  account_id: string;
  channel: LeadChannel;
  contact_name: string;
  mobile: string | null;
  email: string | null;
  region: string | null;
  services_requested: string[] | null;
  notes: string;
  priority: LeadPriority;
  source_detail: string;
  estimated_value: number;
  status: LeadStatus;
  disqualify_reason: string | null;
  converted_client_id: string | null;
  converted_opportunity_id: string | null;
  channel_metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface AccountExtended extends Account {
  legal_name?: string | null;
  cr_number?: string | null;
  vat_number?: string | null;
  logo_url?: string | null;
  letterhead_url?: string | null;
  primary_color?: string;
  bank_name?: string | null;
  bank_iban?: string | null;
  bank_account_name?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  country?: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  is_active?: boolean;
}

export interface PriceOfferExtended extends PriceOffer {
  account_id?: string | null;
  vat_type?: string;
  discount_amount?: number;
  payment_schedule?: Json;
  pdf_url?: string | null;
  sent_date?: string | null;
  version?: number;
}

// ─── Insert Type Aliases ────────────────────────────────────────────────────
export type ClientInsert = TI<"clients">;
export type OpportunityInsert = TI<"opportunities">;
export type PriceOfferInsert = TI<"price_offers">;
export type ContractInsert = TI<"contracts">;
export type ProjectInsert = TI<"projects">;
export type SprintInsert = TI<"sprints">;
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
export type AccountInsert = TI<"accounts">;
export type PlatformInsert = TI<"platforms">;
export type AssetInsert = TI<"assets">;
export type DocumentInsert = TI<"documents">;
export type MilestoneInsert = TI<"milestones">;
export type ModuleInsert = TI<"modules">;

// ─── Update Type Aliases ────────────────────────────────────────────────────
export type ClientUpdate = TU<"clients">;
export type OpportunityUpdate = TU<"opportunities">;
export type ProjectUpdate = TU<"projects">;
export type SprintUpdate = TU<"sprints">;
export type TaskUpdate = TU<"tasks">;
export type FocusSessionUpdate = TU<"focus_sessions">;
export type DailyPlanUpdate = TU<"daily_plans">;
export type QuickCaptureUpdate = TU<"quick_captures">;
export type InvoiceUpdate = TU<"invoices">;
export type PaymentUpdate = TU<"payments">;
export type ContractAmendmentUpdate = TU<"contract_amendments">;
export type MeetingMinutesUpdate = TU<"meeting_minutes">;
export type CommunicationLogUpdate = TU<"communication_logs">;
export type AccountUpdate = TU<"accounts">;
export type PlatformUpdate = TU<"platforms">;
export type AssetUpdate = TU<"assets">;
export type DocumentUpdate = TU<"documents">;
export type MilestoneUpdate = TU<"milestones">;
export type ModuleUpdate = TU<"modules">;

// ─── Partial Types for New Table Inserts/Updates ────────────────────────────
export type ProjectStateContextInsert = Omit<ProjectStateContext, 'id' | 'updated_at'> & { id?: string; updated_at?: string };
export type ProjectStateContextUpdate = Partial<Omit<ProjectStateContext, 'id'>>;
export type StateSnapshotInsert = Omit<StateSnapshot, 'id' | 'created_at'> & { id?: string; created_at?: string };
export type DelegationLogInsert = Omit<DelegationLogEntry, 'id' | 'delegated_at' | 'completed_at' | 'result_summary'> & { id?: string; delegated_at?: string; result_summary?: string | null; completed_at?: string | null };
export type DelegationLogUpdate = Partial<Omit<DelegationLogEntry, 'id'>>;
export type ExpenseInsert = Omit<Expense, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
export type ExpenseUpdate = Partial<Omit<Expense, 'id'>>;
export type RecurringExpenseInsert = Omit<RecurringExpense, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
export type RecurringExpenseUpdate = Partial<Omit<RecurringExpense, 'id'>>;
export type TaxRecordInsert = Omit<TaxRecord, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
export type TaxRecordUpdate = Partial<Omit<TaxRecord, 'id'>>;
export type BankTransactionInsert = Omit<BankTransaction, 'id' | 'created_at'> & { id?: string; created_at?: string };
export type BankTransactionUpdate = Partial<Omit<BankTransaction, 'id'>>;
export type LeadInsert = Omit<Lead, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
export type LeadUpdate = Partial<Omit<Lead, 'id'>>;


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

export interface Subtask {
    id: string;
    title: string;
    completed: boolean;
}

// ─── Agent ID Constants ─────────────────────────────────────────────────────
export const AGENT_IDS = ['Secretary', 'Dev', 'Biz', 'Creative', 'Accounting'] as const;
export type AgentId = typeof AGENT_IDS[number];
