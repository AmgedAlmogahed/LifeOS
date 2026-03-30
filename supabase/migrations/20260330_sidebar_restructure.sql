-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  Sidebar Restructure: leads table + account_id columns                     ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ─── Leads Table ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id),
  channel text NOT NULL CHECK (channel IN ('CH-REF','CH-SOC','CH-WEB','CH-MAP','CH-AI','CH-OUT')),
  contact_name text NOT NULL,
  mobile text,
  email text,
  region text,
  services_requested text[],
  notes text DEFAULT '',
  priority text NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Normal','High','Urgent')),
  source_detail text DEFAULT '',
  estimated_value numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'INCOMING' CHECK (status IN ('INCOMING','CONTACTED','QUALIFIED','DISQUALIFIED','CONVERTED')),
  disqualify_reason text,
  converted_client_id uuid REFERENCES clients(id),
  converted_opportunity_id uuid REFERENCES opportunities(id),
  channel_metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leads_pkey PRIMARY KEY (id),
  CONSTRAINT leads_contact_required CHECK (mobile IS NOT NULL OR email IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_leads_account ON leads(account_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- ─── Add account_id to related tables ─────────────────────────────────────────
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);
ALTER TABLE public.price_offers ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage leads" ON public.leads
  FOR ALL USING (true) WITH CHECK (true);
