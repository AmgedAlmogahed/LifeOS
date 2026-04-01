-- Update existing documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_type text; -- pdf, docx, md, txt, png, etc.
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size_bytes bigint;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_summary text; -- AI-generated summary of the document
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_key_points text[]; -- Array of extracted key points
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_entities jsonb DEFAULT '{}'; -- Extracted entities: names, dates, amounts, etc.
ALTER TABLE documents ADD COLUMN IF NOT EXISTS category text DEFAULT 'general'; -- contract, proposal, brief, requirements, design, invoice, correspondence, reference, internal
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_context_active boolean DEFAULT true; -- Include in agent context?
ALTER TABLE documents ADD COLUMN IF NOT EXISTS summary_generated_at timestamptz;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_by text DEFAULT 'user';

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_documents_client ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_context_active ON documents(is_context_active) WHERE is_context_active = true;

-- New table: context_bundles
CREATE TABLE IF NOT EXISTS public.context_bundles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id),
  project_id uuid REFERENCES projects(id),
  bundle_type text NOT NULL CHECK (bundle_type IN ('client', 'project')),
  context_text text NOT NULL DEFAULT '', -- The compiled context markdown
  document_ids uuid[] DEFAULT '{}', -- Which documents were included
  generated_at timestamptz NOT NULL DEFAULT now(),
  is_stale boolean DEFAULT false, -- Set to true when new docs are uploaded
  CONSTRAINT context_bundles_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_context_bundles_client ON context_bundles(client_id);
CREATE INDEX IF NOT EXISTS idx_context_bundles_project ON context_bundles(project_id);
CREATE INDEX IF NOT EXISTS idx_context_bundles_type ON context_bundles(bundle_type);

-- RLS for documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access" ON documents;
CREATE POLICY "Authenticated access" ON documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS for context_bundles
ALTER TABLE context_bundles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access" ON context_bundles;
CREATE POLICY "Authenticated access" ON context_bundles FOR ALL TO authenticated USING (true) WITH CHECK (true);
