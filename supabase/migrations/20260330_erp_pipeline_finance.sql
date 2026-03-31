-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  ERP Phase 2-5: Pipelines, Finance, AI Integrations                        ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ─── 1. Update opportunity_stage enum (§4.0) ──────────────────────────────
-- In PostgreSQL, altering enums is done via ADD VALUE
ALTER TYPE opportunity_stage ADD VALUE IF NOT EXISTS 'Needs Assessment';
ALTER TYPE opportunity_stage ADD VALUE IF NOT EXISTS 'Proposal';
ALTER TYPE opportunity_stage ADD VALUE IF NOT EXISTS 'Postponed';

-- (We keep 'Draft', 'Price Offer Sent', 'Negotiating', 'Won', 'Lost' for backwards compatibility, 
-- but 'Negotiating' can be used as 'Negotiation' and 'Price Offer Sent' as 'Proposal / Quote Sent')

-- ─── 2. Create Invoices Table (§7.0 Phase 3) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id),
  client_id uuid NOT NULL REFERENCES clients(id),
  project_id uuid REFERENCES projects(id),
  contract_id uuid REFERENCES contracts(id),
  invoice_number text NOT NULL UNIQUE,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  amount numeric NOT NULL DEFAULT 0,
  vat_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled')),
  pdf_url text,
  line_items jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invoices_pkey PRIMARY KEY (id)
);

-- ─── 3. Create Expenses Table (§7.3 Phase 3) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id),
  project_id uuid REFERENCES projects(id),
  description text NOT NULL,
  amount numeric NOT NULL,
  vat_amount numeric DEFAULT 0,
  category text NOT NULL CHECK (category IN ('Infrastructure', 'Tools', 'Subscriptions', 'Office', 'Travel', 'Contractor', 'Marketing', 'Legal', 'Other')),
  receipt_url text,
  vendor_name text,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  is_recurring boolean DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT expenses_pkey PRIMARY KEY (id)
);

-- ─── 4. Project State Context & Summaries (§10.0 Phase 4/5) ─────────────────
CREATE TABLE IF NOT EXISTS public.project_state_context (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) UNIQUE,
  context_summary text NOT NULL DEFAULT '',
  current_blockers text[] DEFAULT '{}',
  last_decision text,
  next_action text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_state_context_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.state_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id),
  snapshot_text text NOT NULL,
  trigger text NOT NULL CHECK (trigger IN ('focus_exit','daily_review','manual')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT state_snapshots_pkey PRIMARY KEY (id)
);

-- ─── 5. Task Agent Assignment (§9.0 Phase 4) ──────────────────────────────────
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS agent_assignable boolean DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_agent text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS estimated_minutes integer;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS energy_level text CHECK (energy_level IN ('deep','shallow','admin'));

-- ─── 6. Delegation Log (§9.0 Phase 4) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.delegation_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id),
  agent_id text NOT NULL,
  delegated_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','failed')),
  result_summary text,
  completed_at timestamptz,
  CONSTRAINT delegation_log_pkey PRIMARY KEY (id)
);
