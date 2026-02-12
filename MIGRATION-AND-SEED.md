# LifeOS — Missing Tables Migration + Nokhbat Al-Mabani Seed Data

> **Purpose:** Create the 13 missing database tables and seed the first real project
> **For:** Coding agent to execute against Supabase
> **Date:** February 12, 2026
> **Priority:** CRITICAL — app cannot function with real data until these tables exist

---

## ⚠️ BUGS TO FIX FIRST

Before running the migration, fix these issues in the existing schema:

### Bug 1: `tasks.project_id` is NOT NULL but should be NULLABLE

**File:** `supabase/schema.sql` line 61
**Current:** `project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE`
**Should be:** `project_id UUID REFERENCES projects(id) ON DELETE CASCADE`

**Why:** Personal tasks (no project) require `project_id = NULL`. The TypeScript type already allows `null` (`project_id: string | null`). The Phase 1 spec has personal tasks in the cockpit. The NOT NULL constraint blocks this.

**Fix SQL (run in Supabase SQL editor):**
```sql
ALTER TABLE tasks ALTER COLUMN project_id DROP NOT NULL;
```

### Bug 2: `projects` table missing `category` and `service_type` columns

**File:** `supabase/schema.sql`
**Current:** These columns don't exist in the SQL schema
**TypeScript expects:** `category: ProjectCategory` and `service_type: ServiceType | null`
**Server action uses:** `service_type` in `projects.ts` line 20

**Fix:** Included in the migration below (Section 1.1).

### Bug 3: Phase 1 migration references `clients(id)` and `contracts(id)` before they exist

**File:** `supabase/migrations/20260212_phase1_ux.sql` lines 77-78
**Problem:** `ALTER TABLE projects ADD COLUMN client_id UUID REFERENCES clients(id)` will fail if `clients` table doesn't exist yet.
**Fix:** Run the migration in Section 1 BEFORE running the Phase 1 UX migration. If Phase 1 migration has already been run, the `client_id` and `contract_id` columns may exist WITHOUT the foreign key constraint. After creating the `clients` and `contracts` tables, add the FK constraints (included in Section 1.1).

---

## SECTION 1: Missing Table Migrations

Run these SQL statements in Supabase SQL Editor **in order** (tables have foreign key dependencies).

### 1.1 Enum Types Needed

```sql
-- These enums are used by multiple tables. Create them if they don't exist.
-- The base schema already has: project_status, task_status, task_priority, task_type, audit_level

DO $$ BEGIN
  CREATE TYPE opportunity_stage AS ENUM ('Draft', 'Price Offer Sent', 'Negotiating', 'Won', 'Lost');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE service_type AS ENUM ('Cloud', 'Web', 'Design', 'Marketing');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE offer_status AS ENUM ('Draft', 'Sent', 'Accepted', 'Rejected', 'Expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE contract_status AS ENUM ('Draft', 'Pending Signature', 'Active', 'Completed', 'Terminated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE lifecycle_stage AS ENUM ('Requirements', 'Building', 'Testing', 'Deploying', 'Maintenance');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE deploy_env AS ENUM ('Vercel', 'Railway', 'Alibaba', 'AWS', 'Other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('Pending', 'Paid', 'Overdue', 'Cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('Transfer', 'Card', 'Cash');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE amendment_status AS ENUM ('Draft', 'Signed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE comm_channel AS ENUM ('WhatsApp', 'Email', 'Call', 'Meeting');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE project_category AS ENUM ('Business', 'Personal', 'Social', 'Research');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_category AS ENUM ('Business', 'Personal', 'Social', 'Research', 'Habit');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```

### 1.2 Fix existing tables

```sql
-- Bug 1: Allow NULL project_id on tasks (for personal tasks)
ALTER TABLE tasks ALTER COLUMN project_id DROP NOT NULL;

-- Bug 2: Add missing columns to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Business';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS service_type TEXT;

-- Add category column to tasks (if not present)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category TEXT;

-- Add is_recurring and recurrence_rule to tasks (TypeScript expects them)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_rule TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;
```

### 1.3 Create: `clients`

```sql
CREATE TABLE IF NOT EXISTS clients (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  email            TEXT NOT NULL DEFAULT '',
  phone            TEXT NOT NULL DEFAULT '',
  brand_assets_url TEXT NOT NULL DEFAULT '',
  brand_primary    TEXT NOT NULL DEFAULT '#6366f1',
  brand_secondary  TEXT NOT NULL DEFAULT '#8b5cf6',
  brand_accent     TEXT NOT NULL DEFAULT '#06b6d4',
  logo_url         TEXT NOT NULL DEFAULT '',
  health_score     INTEGER NOT NULL DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
  notes            TEXT NOT NULL DEFAULT '',
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(is_active);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- Auto-update trigger
CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_clients" ON clients FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### 1.4 Create: `opportunities`

```sql
CREATE TABLE IF NOT EXISTS opportunities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  service_type    TEXT NOT NULL DEFAULT 'Web',
  stage           TEXT NOT NULL DEFAULT 'Draft',
  estimated_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  probability     INTEGER NOT NULL DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  expected_close  DATE,
  won_at          TIMESTAMPTZ,
  lost_reason     TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_client ON opportunities(client_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);

CREATE TRIGGER trg_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_opportunities" ON opportunities FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### 1.5 Create: `price_offers`

```sql
CREATE TABLE IF NOT EXISTS price_offers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  opportunity_id  UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  total_value     DECIMAL(12,2) NOT NULL DEFAULT 0,
  items           JSONB NOT NULL DEFAULT '[]'::jsonb,
  status          TEXT NOT NULL DEFAULT 'Draft',
  valid_until     DATE,
  notes           TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_offers_client ON price_offers(client_id);
CREATE INDEX IF NOT EXISTS idx_price_offers_status ON price_offers(status);

CREATE TRIGGER trg_price_offers_updated_at
  BEFORE UPDATE ON price_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE price_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_price_offers" ON price_offers FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### 1.6 Create: `contracts`

```sql
CREATE TABLE IF NOT EXISTS contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  opportunity_id  UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  price_offer_id  UUID REFERENCES price_offers(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'Draft',
  pdf_url         TEXT NOT NULL DEFAULT '',
  total_value     DECIMAL(12,2) NOT NULL DEFAULT 0,
  start_date      DATE,
  end_date        DATE,
  terms_md        TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

CREATE TRIGGER trg_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_contracts" ON contracts FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### 1.7 Add Foreign Key Constraints to Projects (if columns exist without FK)

```sql
-- If client_id and contract_id columns already exist (from Phase 1 migration)
-- but clients/contracts tables didn't exist yet, add the FK constraints now:
DO $$ BEGIN
  ALTER TABLE projects
    ADD CONSTRAINT fk_projects_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE projects
    ADD CONSTRAINT fk_projects_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```

### 1.8 Create: `lifecycles`

```sql
CREATE TABLE IF NOT EXISTS lifecycles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  current_stage  TEXT NOT NULL DEFAULT 'Requirements',
  stage_history  JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lifecycles_project ON lifecycles(project_id);

CREATE TRIGGER trg_lifecycles_updated_at
  BEFORE UPDATE ON lifecycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE lifecycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_lifecycles" ON lifecycles FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### 1.9 Create: `deployments`

```sql
CREATE TABLE IF NOT EXISTS deployments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  environment     TEXT NOT NULL DEFAULT 'Other',
  label           TEXT NOT NULL,
  url             TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'unknown',
  last_checked_at TIMESTAMPTZ,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deployments_project ON deployments(project_id);

ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_deployments" ON deployments FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### 1.10 Create: `invoices`

```sql
CREATE TABLE IF NOT EXISTS invoices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
  amount      DECIMAL(12,2) NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'Pending',
  due_date    DATE,
  pdf_url     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_invoices" ON invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### 1.11 Create: `payments`

```sql
CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount          DECIMAL(12,2) NOT NULL DEFAULT 0,
  method          TEXT NOT NULL DEFAULT 'Transfer',
  transaction_ref TEXT,
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_payments" ON payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### 1.12 Create: `contract_amendments`

```sql
CREATE TABLE IF NOT EXISTS contract_amendments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id    UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  summary        TEXT NOT NULL DEFAULT '',
  changes_json   JSONB,
  status         TEXT NOT NULL DEFAULT 'Draft',
  effective_date DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contract_amendments_contract ON contract_amendments(contract_id);

ALTER TABLE contract_amendments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_contract_amendments" ON contract_amendments FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### 1.13 Create: `meeting_minutes`

```sql
CREATE TABLE IF NOT EXISTS meeting_minutes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  summary_md      TEXT,
  outcomes_md     TEXT,
  expectations_md TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meeting_minutes_project ON meeting_minutes(project_id);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_date ON meeting_minutes(date DESC);

ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_meeting_minutes" ON meeting_minutes FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### 1.14 Create: `communication_logs`

```sql
CREATE TABLE IF NOT EXISTS communication_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  channel         TEXT NOT NULL DEFAULT 'WhatsApp',
  summary         TEXT NOT NULL DEFAULT '',
  sentiment_score INTEGER CHECK (sentiment_score IS NULL OR (sentiment_score >= -100 AND sentiment_score <= 100)),
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_communication_logs_client ON communication_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_timestamp ON communication_logs(timestamp DESC);

ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_communication_logs" ON communication_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### 1.15 Create: `agent_reports`

```sql
CREATE TABLE IF NOT EXISTS agent_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL DEFAULT 'general',
  title       TEXT NOT NULL,
  body        TEXT NOT NULL DEFAULT '',
  severity    TEXT NOT NULL DEFAULT 'Info',
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_reports_project ON agent_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_reports_resolved ON agent_reports(is_resolved);

ALTER TABLE agent_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_agent_reports" ON agent_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### 1.16 Create: `service_catalog`

```sql
CREATE TABLE IF NOT EXISTS service_catalog (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  service_type          TEXT NOT NULL DEFAULT 'Web',
  description           TEXT NOT NULL DEFAULT '',
  base_price            DECIMAL(12,2) NOT NULL DEFAULT 0,
  unit                  TEXT NOT NULL DEFAULT 'project',
  complexity_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.0,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_catalog_active ON service_catalog(is_active);

ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_service_catalog" ON service_catalog FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

---

## SECTION 2: Seed Data — Nokhbat Al-Mabani (نخبة المباني)

### Context

This is a real client project. Rabwa is building a comprehensive real estate management platform for Nokhbat Al-Mabani, a Saudi property developer. The platform has 4 portals (Admin, Owner, Technician, Contractor), 25 modules, ~54 DB entities, ~178 API endpoints.

**Current state:** Frontend for 3 portals is 100% complete (UI only). Backend (NestJS) is actively in development. The project is in the **Implement** phase, specifically the **Building** lifecycle stage.

### 2.1 Seed: Client

```sql
INSERT INTO clients (id, name, email, phone, notes, health_score, is_active)
VALUES (
  'a1b2c3d4-1111-4000-8000-000000000001',
  'Nokhbat Al-Mabani (نخبة المباني)',
  '',
  '',
  'Elite Saudi property development company. 30+ years experience. Vision 2030 aligned. Luxury residential developments. Platform: 4 portals, 25 modules, ~54 DB entities, ~178 API endpoints.',
  85,
  true
);
```

### 2.2 Seed: Opportunity (Won)

```sql
INSERT INTO opportunities (id, client_id, title, description, service_type, stage, estimated_value, probability, won_at)
VALUES (
  'a1b2c3d4-2222-4000-8000-000000000001',
  'a1b2c3d4-1111-4000-8000-000000000001',
  'Real Estate Management Platform',
  'Comprehensive property lifecycle platform — project creation, sales, ownership transfer, maintenance operations. 4 portals: Admin, Owner, Technician, Contractor.',
  'Cloud',
  'Won',
  0,
  100,
  now() - interval '3 months'
);
```

> **Note:** Set `estimated_value` to the actual contract value if known. Using 0 as placeholder.

### 2.3 Seed: Contract

```sql
INSERT INTO contracts (id, client_id, opportunity_id, title, status, total_value, start_date, terms_md)
VALUES (
  'a1b2c3d4-3333-4000-8000-000000000001',
  'a1b2c3d4-1111-4000-8000-000000000001',
  'a1b2c3d4-2222-4000-8000-000000000001',
  'Nokhbat Platform Development Contract',
  'Active',
  0,
  (now() - interval '3 months')::date,
  'Full-stack development of a real estate management platform. Tech: Next.js 14 (3 portals), NestJS backend, PostgreSQL, Prisma, Redis. Bilingual AR/EN with RTL. Enterprise-grade auth (CASL RBAC+ABAC). Target: production on Alibaba Cloud Saudi Arabia.'
);
```

> **Note:** Set `total_value` and `end_date` to actual contract terms if known.

### 2.4 Seed: Project

```sql
INSERT INTO projects (id, name, description, status, category, progress, service_type, client_id, contract_id, specs_md)
VALUES (
  'a1b2c3d4-4444-4000-8000-000000000001',
  'Nokhbat Platform',
  'Comprehensive real estate management platform for Nokhbat Al-Mabani. 4 portals (Admin, Owner, Technician, Contractor), 25 modules, ~54 DB entities, ~178 API endpoints.',
  'Implement',
  'Business',
  45,
  'Cloud',
  'a1b2c3d4-1111-4000-8000-000000000001',
  'a1b2c3d4-3333-4000-8000-000000000001',
  '## Tech Stack
- **Frontend:** Next.js 14, TypeScript, Tailwind, Radix/Shadcn, Zustand, Framer Motion, next-intl (AR/EN RTL)
- **Backend:** NestJS, PostgreSQL, Prisma, JWT+Redis auth, CASL (RBAC+ABAC)
- **Infra:** Nx monorepo, Docker, Railway (staging), Alibaba Cloud Saudi (production)

## Portals
1. Admin Panel — 100% UI ✅
2. Owner Portal — 100% UI ✅
3. Technician Portal — 100% UI ✅
4. Contractor Portal — 0% (Phase 3)

## Core Modules (25)
Projects & Units, Customer/CRM, Sales & Booking (48h auto-release), Contracts (Nafath e-sign), Financial Management, Maintenance Ops, Technician Mgmt, HR & Payroll (GPS attendance), Inventory (multi-warehouse), Audit Logging

## Key Business Rules
- Bilingual AR/EN + Urdu for technicians (Phase 2)
- OTP verification for maintenance task closure
- GPS check-in for technicians at job sites
- 48-hour auto-release for unpaid reservations
- Mandatory ratings before new maintenance requests
- Max 2 active maintenance requests per owner
- Full audit trail with device fingerprint

## External Integrations (planned)
Nafath API, SMS Gateway, WhatsApp Business API, Google Maps, Bank File Export (WPS)'
);
```

### 2.5 Seed: Lifecycle

```sql
INSERT INTO lifecycles (id, project_id, current_stage, stage_history, started_at)
VALUES (
  'a1b2c3d4-5555-4000-8000-000000000001',
  'a1b2c3d4-4444-4000-8000-000000000001',
  'Building',
  '[
    {"stage": "Requirements", "entered_at": "2025-09-01T00:00:00Z", "exited_at": "2025-10-15T00:00:00Z"},
    {"stage": "Building", "entered_at": "2025-10-15T00:00:00Z"}
  ]'::jsonb,
  '2025-09-01T00:00:00Z'
);
```

> **Note:** Adjust dates to match your actual project timeline.

### 2.6 Seed: Deployments

```sql
-- Staging (Railway)
INSERT INTO deployments (project_id, client_id, environment, label, url, status)
VALUES (
  'a1b2c3d4-4444-4000-8000-000000000001',
  'a1b2c3d4-1111-4000-8000-000000000001',
  'Railway',
  'Staging',
  '',
  'active'
);

-- Production (planned — Alibaba Cloud Saudi)
INSERT INTO deployments (project_id, client_id, environment, label, url, status)
VALUES (
  'a1b2c3d4-4444-4000-8000-000000000001',
  'a1b2c3d4-1111-4000-8000-000000000001',
  'Alibaba',
  'Production (Saudi)',
  '',
  'planned'
);
```

> **Note:** Fill in actual URLs when available.

### 2.7 Seed: Project Assets

```sql
-- GitHub repos (fill in actual URLs)
INSERT INTO project_assets (project_id, asset_type, label, url) VALUES
  ('a1b2c3d4-4444-4000-8000-000000000001', 'github', 'Monorepo (Nx)', ''),
  ('a1b2c3d4-4444-4000-8000-000000000001', 'figma', 'Design System', ''),
  ('a1b2c3d4-4444-4000-8000-000000000001', 'docs', 'Project Documentation', '');
```

> **Note:** Fill in actual URLs.

### 2.8 Seed: Tasks (Current Backend Work)

These represent the active work items. Adjust titles/priorities to match your actual current tasks.

```sql
-- ─── Architecture Tasks (Done) ───
INSERT INTO tasks (project_id, title, status, priority, type, category) VALUES
  ('a1b2c3d4-4444-4000-8000-000000000001', 'Define multi-portal authentication architecture', 'Done', 'Critical', 'Architectural', 'Business'),
  ('a1b2c3d4-4444-4000-8000-000000000001', 'Design CASL RBAC+ABAC permission system', 'Done', 'Critical', 'Architectural', 'Business'),
  ('a1b2c3d4-4444-4000-8000-000000000001', 'Define Prisma schema for core entities', 'Done', 'High', 'Architectural', 'Business');

-- ─── Backend Tasks (In Progress / Todo) ───
INSERT INTO tasks (project_id, title, status, priority, type, category) VALUES
  ('a1b2c3d4-4444-4000-8000-000000000001', 'Implement JWT + Redis session management', 'In Progress', 'Critical', 'Implementation', 'Business'),
  ('a1b2c3d4-4444-4000-8000-000000000001', 'Build named Passport strategies per portal (admin-jwt, owner-jwt, contractor-jwt, technician-jwt)', 'In Progress', 'Critical', 'Implementation', 'Business'),
  ('a1b2c3d4-4444-4000-8000-000000000001', 'Implement refresh token rotation', 'Todo', 'High', 'Implementation', 'Business'),
  ('a1b2c3d4-4444-4000-8000-000000000001', 'Build Projects & Units CRUD APIs', 'Todo', 'High', 'Implementation', 'Business'),
  ('a1b2c3d4-4444-4000-8000-000000000001', 'Build Customer/CRM module APIs', 'Todo', 'High', 'Implementation', 'Business'),
  ('a1b2c3d4-4444-4000-8000-000000000001', 'Build Sales & Booking APIs (48h auto-release logic)', 'Todo', 'High', 'Implementation', 'Business'),
  ('a1b2c3d4-4444-4000-8000-000000000001', 'Build Contracts module APIs (Nafath integration prep)', 'Todo', 'Medium', 'Implementation', 'Business'),
  ('a1b2c3d4-4444-4000-8000-000000000001', 'Build Financial Management APIs', 'Todo', 'Medium', 'Implementation', 'Business'),
  ('a1b2c3d4-4444-4000-8000-000000000001', 'Build Maintenance Operations APIs', 'Todo', 'Medium', 'Implementation', 'Business'),
  ('a1b2c3d4-4444-4000-8000-000000000001', 'Build Technician Management APIs', 'Todo', 'Medium', 'Implementation', 'Business'),
  ('a1b2c3d4-4444-4000-8000-000000000001', 'Build HR & Payroll APIs (GPS attendance, shifts)', 'Todo', 'Low', 'Implementation', 'Business'),
  ('a1b2c3d4-4444-4000-8000-000000000001', 'Build Inventory Management APIs', 'Todo', 'Low', 'Implementation', 'Business'),
  ('a1b2c3d4-4444-4000-8000-000000000001', 'Build Audit Logging system', 'Todo', 'Medium', 'Implementation', 'Business'),
  ('a1b2c3d4-4444-4000-8000-000000000001', 'Connect Admin Panel frontend to backend APIs', 'Todo', 'High', 'Implementation', 'Business'),
  ('a1b2c3d4-4444-4000-8000-000000000001', 'Connect Owner Portal frontend to backend APIs', 'Todo', 'High', 'Implementation', 'Business'),
  ('a1b2c3d4-4444-4000-8000-000000000001', 'Connect Technician Portal frontend to backend APIs', 'Todo', 'Medium', 'Implementation', 'Business'),
  ('a1b2c3d4-4444-4000-8000-000000000001', 'Set up Docker + Railway staging deployment', 'Todo', 'High', 'Implementation', 'Business'),
  ('a1b2c3d4-4444-4000-8000-000000000001', 'Set up GitHub Actions CI/CD pipeline', 'Todo', 'Medium', 'Implementation', 'Business');
```

> **Note:** These are estimated tasks based on the project context provided. Review and adjust titles, statuses, and priorities to match your actual current state. Add due dates once you set them.

---

## SECTION 3: Execution Order

The coding agent should run these steps in order:

1. **Run Section 1.1** — Create enum types
2. **Run Section 1.2** — Fix existing table bugs
3. **Run Sections 1.3 through 1.16** — Create all 13 missing tables (in order — foreign keys depend on earlier tables)
4. **Run Section 1.7** — Add FK constraints to projects table
5. **Verify** — Run `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;` and confirm all tables exist
6. **Run Section 2.1 through 2.8** — Seed Nokhbat Al-Mabani data
7. **Verify seed** — Run `SELECT name, status, progress FROM projects;` and confirm the project shows up
8. **Test the app** — Open the cockpit and verify the project card appears with data

### Quick Verification Queries

```sql
-- Count all tables
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Expected: ~25+ tables

-- Check the seeded project
SELECT p.name, p.status, p.progress, c.name as client_name
FROM projects p
LEFT JOIN clients c ON p.client_id = c.id
WHERE p.name = 'Nokhbat Platform';

-- Check tasks
SELECT title, status, priority FROM tasks
WHERE project_id = 'a1b2c3d4-4444-4000-8000-000000000001'
ORDER BY priority, status;

-- Check lifecycle
SELECT current_stage, stage_history FROM lifecycles
WHERE project_id = 'a1b2c3d4-4444-4000-8000-000000000001';
```

---

## SECTION 4: What Rabwa Should Customize After Seeding

The coding agent should seed the data as-is, then Rabwa should update these values through the LifeOS UI or directly:

1. **Contract value** — `contracts.total_value` is set to 0 (placeholder)
2. **Opportunity value** — `opportunities.estimated_value` is set to 0 (placeholder)
3. **Deployment URLs** — Fill in actual Railway staging URL and production URL
4. **Asset URLs** — Fill in actual GitHub repo, Figma, and docs URLs
5. **Task due dates** — Set deadlines for each task
6. **Task statuses** — Verify which tasks are actually Done / In Progress / Todo
7. **Lifecycle dates** — Adjust `stage_history` dates to match actual project timeline
8. **Project progress** — Set to actual percentage (currently estimated at 45%)

---

*After running this migration and seed, the LifeOS cockpit should show the Nokhbat Platform project card with timeline, tasks, and financial data. The Focus mode for this project should load full context.*
