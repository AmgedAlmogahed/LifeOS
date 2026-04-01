-- Company profile columns on accounts
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS legal_name text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS cr_number text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS vat_number text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS letterhead_url text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#6366f1';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS bank_name text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS bank_iban text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS bank_account_name text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS address_line1 text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS address_line2 text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS country text DEFAULT 'Saudi Arabia';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Company scoping on entities
ALTER TABLE clients ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);
ALTER TABLE price_offers ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);
ALTER TABLE price_offers ADD COLUMN IF NOT EXISTS vat_type text DEFAULT '15%';
ALTER TABLE price_offers ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;
ALTER TABLE price_offers ADD COLUMN IF NOT EXISTS payment_schedule jsonb DEFAULT '[]';
ALTER TABLE price_offers ADD COLUMN IF NOT EXISTS pdf_url text;
ALTER TABLE price_offers ADD COLUMN IF NOT EXISTS sent_date date;
ALTER TABLE price_offers ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;

-- Leads table
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

-- RLS for all new tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated access" ON leads FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE project_state_context ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated access" ON project_state_context FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE state_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated access" ON state_snapshots FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE delegation_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated access" ON delegation_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated access" ON expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated access" ON recurring_expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE tax_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated access" ON tax_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated access" ON bank_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated access" ON project_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated access" ON accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated access" ON platforms FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated access" ON assets FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated access" ON documents FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated access" ON milestones FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated access" ON modules FOR ALL TO authenticated USING (true) WITH CHECK (true);
