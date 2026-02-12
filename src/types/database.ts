// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  VENTURE OS — Database Types v3.0 (Sovereign Foundation)                   ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

// ─── Enums ───────────────────────────────────────────────────────────────────

export type ProjectStatus = "Understand" | "Document" | "Freeze" | "Implement" | "Verify";
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

// ─── Core Row Types ──────────────────────────────────────────────────────────

export interface Client {
    id: string;
    name: string;
    email: string;
    phone: string;
    brand_assets_url: string;
    brand_primary: string;
    brand_secondary: string;
    brand_accent: string;
    logo_url: string;
    health_score: number;
    notes: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Opportunity {
    id: string;
    client_id: string;
    title: string;
    description: string;
    service_type: ServiceType;
    stage: OpportunityStage;
    estimated_value: number;
    probability: number;
    expected_close: string | null;
    won_at: string | null;
    lost_reason: string;
    created_at: string;
    updated_at: string;
}

export interface PriceOffer {
    id: string;
    client_id: string;
    opportunity_id: string | null;
    title: string;
    total_value: number;
    items: PriceOfferItem[];
    status: OfferStatus;
    valid_until: string | null;
    notes: string;
    created_at: string;
    updated_at: string;
}

export interface PriceOfferItem {
    name: string;
    service_type: ServiceType;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
}

export interface Contract {
    id: string;
    client_id: string;
    opportunity_id: string | null;
    price_offer_id: string | null;
    title: string;
    status: ContractStatus;
    pdf_url: string;
    total_value: number;
    start_date: string | null;
    end_date: string | null;
    terms_md: string;
    created_at: string;
    updated_at: string;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    status: ProjectStatus;
    category: ProjectCategory;
    progress: number;
    is_frozen: boolean;
    specs_md: string;
    client_id: string | null;
    contract_id: string | null;
    service_type: ServiceType | null;
    last_audit_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface Lifecycle {
    id: string;
    project_id: string;
    current_stage: LifecycleStage;
    stage_history: StageHistoryEntry[];
    started_at: string;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface StageHistoryEntry {
    stage: LifecycleStage;
    entered_at: string;
    exited_at?: string;
}

export interface Deployment {
    id: string;
    project_id: string;
    client_id: string | null;
    environment: DeployEnv;
    label: string;
    url: string;
    status: string;
    last_checked_at: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
}

export interface AgentReport {
    id: string;
    client_id: string | null;
    project_id: string | null;
    report_type: string;
    title: string;
    body: string;
    severity: string;
    is_resolved: boolean;
    resolved_at: string | null;
    created_at: string;
}

export interface ServiceCatalogItem {
    id: string;
    name: string;
    service_type: ServiceType;
    description: string;
    base_price: number;
    unit: string;
    complexity_multiplier: number;
    is_active: boolean;
    created_at: string;
}

// ─── Retained Types ──────────────────────────────────────────────────────────

export interface ProjectAsset {
    id: string;
    project_id: string;
    asset_type: AssetType;
    label: string;
    url: string;
    created_at: string;
}

export interface Task {
    id: string;
    project_id: string | null;
    category: TaskCategory | null;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    type: TaskType;
    due_date: string | null;
    is_recurring: boolean;
    recurrence_rule: string | null;
    reminder_sent: boolean;
    metadata: Record<string, unknown> | null;
    agent_context: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
}

export interface AuditLog {
    id: string;
    level: AuditLevel;
    message: string;
    source: string;
    project_id: string | null;
    timestamp: string;
}

export interface SystemConfig {
    key: string;
    value: Record<string, unknown> | string;
    created_at: string;
    updated_at: string;
}

export interface GuardianRule {
    id: string;
    name: string;
    description: string;
    pattern: string;
    severity: AuditLevel;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface VaultSecret {
    id: string;
    name: string;
    description: string;
    encrypted_value: string;
    last_rotated_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface LeverageLog {
    id: string;
    task_id: string | null;
    project_id: string | null;
    hours_saved: number;
    description: string;
    timestamp: string;
}

export type InvoiceStatus = "Pending" | "Paid" | "Overdue" | "Cancelled";
export type PaymentMethod = "Transfer" | "Card" | "Cash";
export type AmendmentStatus = "Draft" | "Signed";
export type CommChannel = "WhatsApp" | "Email" | "Call" | "Meeting";

export interface Invoice {
    id: string;
    client_id: string;
    project_id: string | null;
    amount: number;
    status: InvoiceStatus;
    due_date: string | null;
    pdf_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface Payment {
    id: string;
    invoice_id: string;
    amount: number;
    method: PaymentMethod;
    transaction_ref: string | null;
    timestamp: string;
}

export interface ContractAmendment {
    id: string;
    contract_id: string;
    summary: string;
    changes_json: Record<string, unknown> | null;
    status: AmendmentStatus;
    effective_date: string | null;
    created_at: string;
}

export interface MeetingMinutes {
    id: string;
    project_id: string | null;
    title: string;
    date: string;
    summary_md: string | null;
    outcomes_md: string | null;
    expectations_md: string | null;
    created_at: string;
}

export interface CommunicationLog {
    id: string;
    client_id: string;
    channel: CommChannel;
    summary: string;
    sentiment_score: number | null;
    timestamp: string;
}

export type InvoiceInsert = Omit<Invoice, "id" | "created_at" | "updated_at">;
export type InvoiceUpdate = Partial<InvoiceInsert>;

export type PaymentInsert = Omit<Payment, "id" | "timestamp">; // payment timestamp is usually set by user or default
export type PaymentUpdate = Partial<PaymentInsert>;

export type ContractAmendmentInsert = Omit<ContractAmendment, "id" | "created_at">;
export type ContractAmendmentUpdate = Partial<ContractAmendmentInsert>;

export type MeetingMinutesInsert = Omit<MeetingMinutes, "id" | "created_at">;
export type MeetingMinutesUpdate = Partial<MeetingMinutesInsert>;

export type CommunicationLogInsert = Omit<CommunicationLog, "id">;
export type CommunicationLogUpdate = Partial<CommunicationLogInsert>;


// ─── Insert Types ────────────────────────────────────────────────────────────

export type ClientInsert = Omit<Client, "id" | "created_at" | "updated_at">;
export type OpportunityInsert = Omit<Opportunity, "id" | "created_at" | "updated_at">;
export type PriceOfferInsert = Omit<PriceOffer, "id" | "created_at" | "updated_at">;
export type ContractInsert = Omit<Contract, "id" | "created_at" | "updated_at">;
export type ProjectInsert = Omit<Project, "id" | "created_at" | "updated_at">;
export type TaskInsert = Omit<Task, "id" | "created_at" | "updated_at">;
export type AuditLogInsert = Omit<AuditLog, "id" | "timestamp">;
export type GuardianRuleInsert = Omit<GuardianRule, "id" | "created_at" | "updated_at">;

// ─── Update Types ────────────────────────────────────────────────────────────

export type ClientUpdate = Partial<Omit<Client, "id" | "created_at" | "updated_at">>;
export type OpportunityUpdate = Partial<Omit<Opportunity, "id" | "created_at" | "updated_at">>;
export type ProjectUpdate = Partial<Omit<Project, "id" | "created_at" | "updated_at">>;
export type TaskUpdate = Partial<Omit<Task, "id" | "created_at" | "updated_at">>;

// ─── Database Schema ─────────────────────────────────────────────────────────

export interface Database {
    public: {
        Tables: {
            clients: { Row: Client; Insert: ClientInsert; Update: ClientUpdate };
            opportunities: { Row: Opportunity; Insert: OpportunityInsert; Update: OpportunityUpdate };
            price_offers: { Row: PriceOffer; Insert: PriceOfferInsert; Update: Partial<PriceOfferInsert> };
            contracts: { Row: Contract; Insert: ContractInsert; Update: Partial<ContractInsert> };
            projects: { Row: Project; Insert: ProjectInsert; Update: ProjectUpdate };
            project_assets: { Row: ProjectAsset; Insert: Omit<ProjectAsset, "id" | "created_at">; Update: Partial<Omit<ProjectAsset, "id" | "created_at">> };
            tasks: { Row: Task; Insert: TaskInsert; Update: TaskUpdate };
            audit_logs: { Row: AuditLog; Insert: AuditLogInsert; Update: never };
            system_config: { Row: SystemConfig; Insert: Omit<SystemConfig, "created_at" | "updated_at">; Update: Partial<Omit<SystemConfig, "created_at" | "updated_at">> };
            guardian_rules: { Row: GuardianRule; Insert: GuardianRuleInsert; Update: Partial<Omit<GuardianRule, "id" | "created_at" | "updated_at">> };
            vault_secrets: { Row: VaultSecret; Insert: Omit<VaultSecret, "id" | "created_at" | "updated_at">; Update: Partial<Omit<VaultSecret, "id" | "created_at" | "updated_at">> };
            leverage_logs: { Row: LeverageLog; Insert: Omit<LeverageLog, "id" | "timestamp">; Update: never };
            lifecycles: { Row: Lifecycle; Insert: Omit<Lifecycle, "id" | "created_at" | "updated_at">; Update: Partial<Omit<Lifecycle, "id" | "created_at" | "updated_at">> };
            deployments: { Row: Deployment; Insert: Omit<Deployment, "id" | "created_at">; Update: Partial<Omit<Deployment, "id" | "created_at">> };
            agent_reports: { Row: AgentReport; Insert: Omit<AgentReport, "id" | "created_at">; Update: Partial<Omit<AgentReport, "id" | "created_at">> };
            service_catalog: { Row: ServiceCatalogItem; Insert: Omit<ServiceCatalogItem, "id" | "created_at">; Update: Partial<Omit<ServiceCatalogItem, "id" | "created_at">> };
            invoices: { Row: Invoice; Insert: InvoiceInsert; Update: InvoiceUpdate };
            payments: { Row: Payment; Insert: PaymentInsert; Update: PaymentUpdate };
            contract_amendments: { Row: ContractAmendment; Insert: ContractAmendmentInsert; Update: ContractAmendmentUpdate };
            meeting_minutes: { Row: MeetingMinutes; Insert: MeetingMinutesInsert; Update: MeetingMinutesUpdate };
            communication_logs: { Row: CommunicationLog; Insert: CommunicationLogInsert; Update: CommunicationLogUpdate };

        };
    };
}
