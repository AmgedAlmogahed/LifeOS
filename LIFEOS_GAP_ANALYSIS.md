# LIFEOS — System Health & Gap Analysis Report

> **Auditor:** Antigravity (AI Systems Auditor)
> **Date:** 2026-02-25
> **Repository:** `/Users/amgedalmogahed/Documents/MylifeOs/life-os`
> **Reference Spec:** `ARCHITECTURE.md` v0.2.0 + Relational UX Pivot Requirements
> **Methodology:** Recursive scan of `/src/app`, `/src/components`, `/src/lib`; inspection of `supabase/schema.sql` and all 6 migration files; line-level review of key components.

---

## Section 1 — Routing & Page Architecture Audit

### 1.1 Current App Router Map

All routes live under the `(authenticated)` route group, gated by middleware. The full path inventory is:

| Route | File | Status |
|---|---|---|
| `/cockpit` | `(authenticated)/cockpit/page.tsx` | ✅ Exists |
| `/focus/[projectId]` | `(authenticated)/focus/[projectId]/page.tsx` | ✅ Exists |
| `/plan` | `(authenticated)/plan/page.tsx` | ✅ Exists |
| `/inbox` | `(authenticated)/inbox/page.tsx` | ✅ Exists |
| `/calendar` | `(authenticated)/calendar/page.tsx` | ✅ Exists |
| `/tasks` | `(authenticated)/tasks/page.tsx` | ✅ Exists |
| `/forge` | `(authenticated)/forge/page.tsx` | ✅ Exists |
| `/forge/[id]` | `(authenticated)/forge/[id]/page.tsx` | ✅ Exists |
| `/projects` | `(authenticated)/projects/page.tsx` | ✅ Exists |
| `/projects/[id]` | `(authenticated)/projects/[id]/page.tsx` | ✅ Exists |
| `/modules` | `(authenticated)/modules/page.tsx` | ✅ Exists |
| `/clients` | `(authenticated)/clients/page.tsx` | ✅ Exists |
| `/clients/[id]` | `(authenticated)/clients/[id]/page.tsx` | ✅ Exists |
| `/deployments` | `(authenticated)/deployments/page.tsx` | ✅ Exists |
| `/finance` | `(authenticated)/finance/page.tsx` | ✅ Exists |
| `/pipeline` | `(authenticated)/pipeline/page.tsx` | ✅ Exists |
| `/comms` | `(authenticated)/comms/page.tsx` | ✅ Exists |
| `/meetings` | `(authenticated)/meetings/page.tsx` | ✅ Exists |
| `/logs` | `(authenticated)/logs/page.tsx` | ✅ Exists |
| `/rules` | `(authenticated)/rules/page.tsx` | ✅ Exists |
| `/leverage` | `(authenticated)/leverage/page.tsx` | ✅ Exists |
| `/vault` | `(authenticated)/vault/page.tsx` | ✅ Exists |
| `/terminal` | `(authenticated)/terminal/page.tsx` | ✅ Exists |
| `/generator` | `(authenticated)/generator/page.tsx` | ✅ Exists |
| `/settings` | `(authenticated)/settings/page.tsx` | ✅ Exists |
| `/portal` | `(authenticated)/portal/page.tsx` | ✅ Exists |
| `/dashboard` | `(authenticated)/dashboard/page.tsx` | ✅ Exists |
| `/cockpit` → Sprints (/cockpit/sprints) | — | ❌ **Missing** |
| `/authority` (Authority Tracking Module) | — | ❌ **Missing** |
| `/wizard` or `/projects/new` (multi-step wizard) | — | ❌ **Missing** |
| `/clients/[id]/hub` (Client Hub container) | — | ❌ **Missing** |

### 1.2 Gap: Missing Routes per New IA

| Required Route | Description | Gap Severity |
|---|---|---|
| **Authority Tracking Module** (`/authority` or `/authority/[id]`) | No route, no page, no component. This entire module is absent from the application. | 🔴 **Critical** |
| **Project Wizard** (`/projects/wizard` multi-step route) | A multi-step wizard was implemented in a prior sprint but there is **no dedicated route** for it in the current `(authenticated)` group. The wizard form lives under `/projects/new` but the spec calls for a first-class multi-step discrete URL approach (e.g., `/projects/new/step/[step]`). | 🟡 **High** |
| **Client Hub** (`/clients/[id]/hub` or a tabbed parent container) | `/clients/[id]` exists via `client-dossier.tsx` but it is a single flat page, not the parent container with child routes (Comms, Contracts, Projects, Contacts) defined in the IA. | 🟡 **High** |

### 1.3 UX Check: Navigation Model

| Spec Requirement | Current Implementation | Status |
|---|---|---|
| **Contextual Top-Bar only** — "No sidebar. The app uses a contextual top bar that changes based on mode (cockpit/focus/plan)" (ARCHITECTURE.md §9.2) | **Both a sidebar AND context-bar are implemented simultaneously.** `context-bar.tsx` is present and properly mode-aware (cockpit/focus/plan). However, `sidebar.tsx` also exists — a traditional collapsible left-nav with 20+ links — and is actively rendered inside `(authenticated)/layout.tsx`. | 🔴 **Divergent** |
| Context Bar must be mode-aware (cockpit/focus/plan props) | `ContextBarProps` accepts `mode: 'cockpit' | 'focus' | 'plan'` and renders correctly | ✅ **Implemented** |
| **No permanent feature-list navigation** | Sidebar exposes full feature list: `/leverage`, `/vault`, `/terminal`, `/rules`, `/settings`, etc. | 🟡 **Contradicts spec** |

**Diagnosis:** The Sidebar is a legacy artifact from an earlier implementation phase. The `ContextBar` correctly implements the "Contextual Top-Bar" model defined in the new IA, but the sidebar was never decommissioned. The result is a **dual-navigation** state: users currently see both a hamburger-triggered sidebar drawer AND the mode-aware context bar simultaneously.

---

## Section 2 — Data Layer (Supabase) Audit

### 2.1 Schema Inventory

Tables confirmed present across `schema.sql` (v2.0) and 6 sequential migration files:

| Table | Source | Notes |
|---|---|---|
| `projects` | schema.sql | Columns: `id, name, description, status, progress, is_frozen, specs_md, last_audit_at`, etc. Expanded via migrations to include `client_id`, `contract_id`, `budget`, `account_id` |
| `tasks` | schema.sql | Expanded with `committed_date`, `migrated_from`, `delegated_to`, `delegation_status`, `completed_at`, `sprint_id`, `story_points`, `subtasks` (JSONB), `module_id` |
| `project_assets` | schema.sql | Links files/URLs to projects |
| `audit_logs` | schema.sql | Guardian feed |
| `guardian_rules` | schema.sql | Rule definitions |
| `system_config` | schema.sql | KV store |
| `vault_secrets` | schema.sql | Encrypted secrets |
| `leverage_logs` | schema.sql | Automation ROI log |
| `focus_sessions` | 20260212_phase1_ux | Session tracking |
| `daily_plans` | 20260212_phase1_ux | Evening ritual records |
| `quick_captures` | 20260212_phase1_ux | Inbox landing zone |
| `health_snapshots` | 20260212_phase1_ux | Dimension health scores |
| `sprints` | 20260212_sprints | Sprint lifecycle |
| `project_phases` | 20260215_module_architecture | Phase hierarchy |
| `project_modules` | 20260215_module_architecture | Module hierarchy |
| `accounts` | 20260220_domain_restructure | Client/brand account container |
| `platforms` | 20260220_domain_restructure | Platform registry |
| `assets` (global) | 20260220_domain_restructure | Cross-entity asset store |
| `documents` | 20260220_domain_restructure | Document records linked to assets |
| `milestones` | 20260220_domain_restructure | Basic milestone records for projects |
| `modules` | 20260220_domain_restructure | Duplicate of `project_modules` — schema conflict risk |

> **Note:** `clients`, `contracts`, `opportunities`, `price_offers`, `invoices`, `meetings`, `comms`, `deployments` are referenced in lib actions and type definitions (`supabase.ts`) confirming they exist in the live Supabase instance, but they are **absent from the tracked migration files**. Their schema was likely established in an earlier untracked migration.

### 2.2 Gap: Missing Tables per New IA

| Required Table | Purpose | Gap Status |
|---|---|---|
| **`scope_nodes`** (hierarchical work breakdown tree) | A recursive/adjacency-list table for nested scope breakdown (WBS-style). The spec references a hierarchical `scope_nodes` tree for projects. The existing `project_phases` → `project_modules` → `tasks` is a linear 3-level depth, not a flexible recursive tree. | 🔴 **Missing** |
| **`financial_milestones`** ("Ghost Invoices") | Placeholder invoice records that auto-convert to real invoices at project milestones. The `milestones` table exists but has no financial linkage, no `invoice_id` FK, no `ghost` flag, no auto-generation logic. | 🔴 **Missing** |
| **`authority_applications`** | Records of permit applications, government approvals, regulatory filings linked to projects. Zero presence in any migration file, action file, or component. | 🔴 **Missing** |
| **`delegations`** | Per-ARCHITECTURE.md §7.1, a `delegations` table was specified to track OpenClaw task queue with status. Currently delegation state is stored as flat columns (`delegated_to`, `delegation_status`) on the `tasks` table — there is no standalone delegation entity with its own lifecycle. | 🟡 **Partial / Degraded** |
| **`briefings`** | Generated briefing content with timestamps (ARCHITECTURE.md §7.1) | 🔴 **Missing** |
| **`goals` / `goal_progress`** | Specified in Phase 3 — Reflection Engine. Completely absent. | 🟡 **Planned, Not Built** |

### 2.3 Logic Check: Foreign Key Relationships

| Relationship | Status |
|---|---|
| `tasks.project_id → projects.id` | ✅ **Present** (schema.sql, CASCADE) |
| `tasks.module_id → project_modules.id` | ✅ **Present** (migration 20260215) |
| `tasks.sprint_id → sprints.id` | ✅ **Present** (migration 20260212_sprints) |
| `tasks.migrated_from → tasks.id` (self-ref) | ✅ **Present** (migration 20260212_phase1) |
| **`tasks.contract_id`** (task ↔ contract reference) | ❌ **Missing** — there is no direct FK linking a task to a contract. `projects.contract_id` exists, but tasks have no column referencing `contracts.id` directly. The Contract Reference Chip for tasks therefore cannot be built without a schema addition. |
| `projects.client_id → clients.id` | ✅ **Present** (migration 20260212_phase1) |
| `projects.contract_id → contracts.id` | ✅ **Present** (migration 20260212_phase1) |
| `focus_sessions.project_id → projects.id` | ✅ **Present** |
| `milestones.project_id → projects.id` | ✅ **Present** (migration 20260220) |
| `milestones.invoice_id` | ❌ **Missing** — no FK to `invoices` |

---

## Section 3 — Component & State Audit

### 3.1 Project Detail View — Tabbed Layout Check

**File:** `src/app/(authenticated)/forge/[id]/forge-detail.tsx`

| Spec Requirement | Implementation | Status |
|---|---|---|
| **Tabbed Layout** with Gantt, Docs, Authority tabs | `forge-detail.tsx` declares `const [activeTab, setActiveTab] = useState<"overview">("overview")`. Only **one tab ("Overview") is defined**. The tab navigation bar contains a single button. | 🔴 **Stub Only** |
| Gantt Chart tab | Not implemented. A `TODO` comment in `FlowBoard.tsx` line 3 reads: `// TODO: GAP-13 (P3) — Timeline view mode (Gantt-style sprint timeline)` | 🔴 **Absent** |
| Docs tab | The `documents` table exists in the schema but no document viewer/editor component or tab is wired into the Forge Detail view. | 🔴 **Absent** |
| Authority tab | No component exists for this anywhere in the codebase. | 🔴 **Absent** |

### 3.2 Task Drawer — Feature Audit

**File:** `src/components/features/tasks/TaskDetailSheet.tsx`

| Spec Requirement | Implementation | Status |
|---|---|---|
| **Contract Reference Chip** (PDF page linking) | ❌ **Not present.** The TaskDetailSheet contains no field for linking a task to a contract clause or PDF page. There is no contract chip, no document reference input, no page-number field. | 🔴 **Missing** |
| **Blocker Input** (block reason text field) | ✅ **Implemented.** A `showBlockInput` state toggles a text field for block reason. The `handleBlock()` function updates status to "Blocked" and the reason is captured (though it's stored only in local state, not persisted to DB — a minor gap). | 🟡 **Partial** |
| Subtask support | ✅ Fully implemented with progress bar and add/toggle actions |
| Delegation to OpenClaw | ✅ Implemented via `handleDelegate()` — sets `delegated_to: "openclaw"` and `delegation_status: "pending"` |
| Time tracking display | ✅ Shows `time_spent_minutes` when > 0 |
| Due date picker | ✅ Implemented |
| Status & Priority selects | ✅ Implemented |

**Blocker Persistence Gap:** The `blockReason` text entered in the blocker input is **not saved to the database**. `handleBlock()` calls `updateTask(task.id, { status: "Blocked" })` but omits the reason. There is no `block_reason` column in the tasks schema and no metadata write for it.

### 3.3 OpenClaw ↔ Telegram Integration Check

| Spec Requirement | Status |
|---|---|
| **ARCHITECTURE.md §9.1** states: "Agent Comm: Telegram Bot — ✅ Connected" | The architecture doc marks this as connected at the infrastructure level. |
| **Telegram** referenced in `src/types/database.ts` as `CaptureSource = "web" \| "telegram" \| "voice" \| "agent"` | ✅ The data type is prepared to receive Telegram-sourced captures |
| Active Telegram webhook or bot integration code in `/src` | ❌ **No bot integration code exists in this repository.** The integration lives in the **OpenClaw agent codebase** (hosted on Hostinger), not in the LifeOS Next.js app. |
| Morning/Evening briefing generation logic in LifeOS | ❌ **Absent from this repo.** No `briefings` table, no scheduled function, no briefing generation component. This is purely agent-side. |

**Conclusion:** The Telegram integration for *briefings* is an **agent-side concern** and cannot be audited from this repository. However, LifeOS's own role in the loop — the `briefings` table (ARCHITECTURE.md §7.1) — that would store generated briefing history **does not exist**.

---

## Section 4 — The "Consultancy Gap" Summary

This section captures the missing **Engineering** logic and advanced domain modules defined in the new IA that have zero implementation footprint.

### 4.1 Gantt Chart Visualization

| Item | Status |
|---|---|
| Any Gantt chart library (e.g., `dhtmlx-gantt`, `frappe-gantt`, `react-gantt-timeline`) | ❌ Not installed (no reference in `package.json`) |
| Timeline data model (start_date, end_date per task/phase) | 🟡 Partial — `sprints` has `started_at / planned_end_at`. Tasks have `due_date` only. No `start_date` on tasks. |
| Gantt rendering component | ❌ Completely absent. `FlowBoard.tsx:3` has a TODO acknowledging this gap. |
| Gantt tab in Project Detail | ❌ The tab row in `forge-detail.tsx` only has "Overview" |

**Impact:** The sprint-based timeline view, which is the primary visual tool for communicating project progress to consultancy clients, is fully absent.

### 4.2 Sub-Client Role Handling (Brokers / Contractors)

| Item | Status |
|---|---|
| `clients` table role differentiation (Direct Client vs. Broker vs. Sub-Contractor) | ❌ The `clients` action file and type definitions show a flat client model with no `role`, `client_type`, or `parent_client_id` column. |
| Broker relationship (client who brings other clients) | ❌ No FK or join table linking clients to parent brokers. |
| Contractor scoping (sub-contractor assigned to a project module) | ❌ `project_modules` has no `assigned_contractor_id`. No contractor entity exists. |
| Commission/referral tracking for brokers | ❌ Absent. No `commissions` table, no referral_fee column on `contracts` or `invoices`. |

**Impact:** The multi-party project model where a broker client introduces a direct client, who in turn has sub-contractors executing work, cannot be represented in the current schema.

### 4.3 Document Versioning Logic

| Item | Status |
|---|---|
| `documents` table | ✅ Exists (migration 20260220) — `id, asset_id, title, content, created_at, updated_at` |
| Version history columns (`version_number`, `parent_version_id`, `change_summary`) | ❌ **Missing.** The `documents` table has no versioning columns. |
| Document version comparison UI | ❌ No component exists for this. |
| Contract amendment versioning (`contract_amendments` table) | 🟡 Referenced in `supabase.ts` type definitions — the table likely exists in the live DB but is absent from tracked migrations. |
| PDF page-linking (anchor a task to a contract PDF clause/page) | ❌ No `document_page_ref` or equivalent field on tasks or contracts. The Contract Reference Chip specified in the Task Drawer is entirely absent. |

### 4.4 Consolidated Gap Severity Matrix

| Domain | Feature | Severity | Estimated Effort |
|---|---|---|---|
| Routing | Authority Tracking Module (`/authority`) | 🔴 Critical | L (new module) |
| Routing | Project Wizard multi-step route | 🟡 High | M (routing refactor) |
| Routing | Client Hub parent container | 🟡 High | M |
| Navigation | Sidebar decommission (still active) | 🟡 High | S (remove + test) |
| Schema | `scope_nodes` (hierarchical WBS) | 🔴 Critical | L (new table + UI) |
| Schema | `financial_milestones` (Ghost Invoices) | 🔴 Critical | L |
| Schema | `authority_applications` | 🔴 Critical | L |
| Schema | `tasks.contract_id` FK | 🟡 High | S (migration) |
| Schema | `milestones.invoice_id` FK | 🟡 High | S (migration) |
| Schema | `delegations` table (vs. flat columns) | 🟡 Medium | M |
| Schema | `briefings` table | 🟡 Medium | S |
| Schema | `goals` / `goal_progress` | 🟡 Medium | M |
| Component | Gantt Chart (library + component + tab) | 🔴 Critical | XL |
| Component | Forge Detail: Gantt tab | 🔴 Critical | L |
| Component | Forge Detail: Docs tab | 🟡 High | M |
| Component | Forge Detail: Authority tab | 🔴 Critical | L (blocked on schema) |
| Component | Contract Reference Chip in Task Drawer | 🟡 High | M |
| Component | Block reason persistence | 🟡 Medium | S |
| Data Model | Sub-client role handling (Broker/Contractor) | 🔴 Critical | XL |
| Data Model | Document versioning columns | 🟡 High | M |
| Integration | Briefing generation in LifeOS | 🟡 Medium | M |

**Effort scale:** S = < 1 day · M = 1–3 days · L = 3–7 days · XL = > 1 week

---

## Appendix: Files Scanned

```
src/app/(authenticated)/         — 109 files (full directory tree)
src/components/features/         — 53 files
src/lib/actions/                 — 22 action files
src/lib/supabase/                — client.ts, server.ts, middleware.ts
supabase/schema.sql              — v2.0 baseline
supabase/migrations/             — 6 migration files (20260212 → 20260220)
ARCHITECTURE.md                  — v0.2.0 Living Document (653 lines)
src/components/layout/sidebar.tsx
src/components/layout/context-bar.tsx
src/app/(authenticated)/forge/[id]/forge-detail.tsx
src/components/features/tasks/TaskDetailSheet.tsx
src/components/features/focus/FlowBoard.tsx (GAP-13 TODO)
src/types/database.ts
src/types/supabase.ts
```

---

*This report was generated by an automated codebase audit. All findings are derived from file-level analysis and should be validated against the live Supabase instance schema before sprint planning.*
