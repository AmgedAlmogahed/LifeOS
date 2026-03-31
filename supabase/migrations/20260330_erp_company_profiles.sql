-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  ERP Phase 1: Company Profiles, Enhanced Client & Quote Fields             ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ─── 1. Extend accounts table → Company Profiles (§0.3, §1.1) ────────────────
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS legal_name text;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS cr_number text;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS vat_number text;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS letterhead_url text;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#6366f1';
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS bank_name text;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS bank_iban text;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS bank_account_name text;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS address_line1 text;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS address_line2 text;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS country text DEFAULT 'Saudi Arabia';
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- ─── 2. Extend clients table → CRM fields (§3.4) ────────────────────────────
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS client_type text DEFAULT 'Company'
  CHECK (client_type IN ('Individual','Company','Gov Entity','Developer','Contractor'));
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS cr_number text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS preferred_contact text DEFAULT 'Phone'
  CHECK (preferred_contact IN ('Phone','WhatsApp','Email'));
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS classification text DEFAULT 'NEW'
  CHECK (classification IN ('NEW','ACTIVE','VIP','DORMANT','ARCHIVED'));
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS parent_broker_id uuid REFERENCES public.clients(id);
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS secondary_phone text;

-- ─── 3. Extend price_offers table → Enhanced quoting (§5.2, §13) ─────────────
ALTER TABLE public.price_offers ADD COLUMN IF NOT EXISTS vat_type text DEFAULT '15%'
  CHECK (vat_type IN ('15%','Exempt','None'));
ALTER TABLE public.price_offers ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;
ALTER TABLE public.price_offers ADD COLUMN IF NOT EXISTS payment_schedule jsonb DEFAULT '[]';
ALTER TABLE public.price_offers ADD COLUMN IF NOT EXISTS pdf_url text;
ALTER TABLE public.price_offers ADD COLUMN IF NOT EXISTS sent_date timestamptz;
ALTER TABLE public.price_offers ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;

-- ─── 4. Add communication_logs.sentiment if missing (§3.5) ───────────────────
ALTER TABLE public.communication_logs ADD COLUMN IF NOT EXISTS sentiment text DEFAULT 'Neutral'
  CHECK (sentiment IN ('Positive','Neutral','Negative'));
ALTER TABLE public.communication_logs ADD COLUMN IF NOT EXISTS follow_up_date date;
ALTER TABLE public.communication_logs ADD COLUMN IF NOT EXISTS next_step text;

-- ─── 5. Add opportunities.lost_reason + postponed fields (§4.3) ──────────────
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS lost_reason text;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS won_date timestamptz;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS postponed_followup date;
