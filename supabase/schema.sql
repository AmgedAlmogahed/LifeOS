-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  LIFE OS — ARCHITECT'S COMMAND CENTER                                      ║
-- ║  Database Schema v2.0                                                      ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ─── Drop existing types if re-running ───────────────────────────────────────
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS task_priority CASCADE;
DROP TYPE IF EXISTS task_type CASCADE;
DROP TYPE IF EXISTS audit_level CASCADE;

-- ─── Enums ───────────────────────────────────────────────────────────────────
CREATE TYPE project_status AS ENUM (
  'Understand', 'Document', 'Freeze', 'Implement', 'Verify'
);

CREATE TYPE task_status AS ENUM (
  'Todo', 'In Progress', 'Done', 'Blocked'
);

CREATE TYPE task_priority AS ENUM (
  'Critical', 'High', 'Medium', 'Low'
);

CREATE TYPE task_type AS ENUM (
  'Architectural', 'Implementation', 'Audit', 'Maintenance'
);

CREATE TYPE audit_level AS ENUM (
  'Critical', 'Warning', 'Info'
);

-- ─── Projects ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  status      project_status NOT NULL DEFAULT 'Understand',
  progress    INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  is_frozen   BOOLEAN NOT NULL DEFAULT false,
  specs_md    TEXT DEFAULT '',
  last_audit_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Project Assets ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  asset_type  TEXT NOT NULL CHECK (asset_type IN ('github', 'figma', 'supabase', 'docs', 'other')),
  label       TEXT NOT NULL,
  url         TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Tasks ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  status      task_status NOT NULL DEFAULT 'Todo',
  priority    task_priority NOT NULL DEFAULT 'Medium',
  type        task_type NOT NULL DEFAULT 'Implementation',
  due_date    DATE,
  metadata    JSONB DEFAULT '{}'::jsonb,
  agent_context JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Audit Logs (Guardian Feed) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level       audit_level NOT NULL DEFAULT 'Info',
  message     TEXT NOT NULL,
  source      TEXT NOT NULL DEFAULT 'System',
  project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── System Config ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_config (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Guardian Rules (Audit Rules) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guardian_rules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  pattern     TEXT NOT NULL,
  severity    audit_level NOT NULL DEFAULT 'Warning',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Vault Secrets ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vault_secrets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  encrypted_value TEXT NOT NULL,
  last_rotated_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Leverage Logs (Automation ROI) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leverage_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID REFERENCES tasks(id) ON DELETE SET NULL,
  project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
  hours_saved DECIMAL(6,2) NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_level ON audit_logs(level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_project ON audit_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_assets_project ON project_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_leverage_logs_timestamp ON leverage_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_guardian_rules_active ON guardian_rules(is_active);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRIGGERS: auto-update updated_at
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_system_config_updated_at
  BEFORE UPDATE ON system_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_guardian_rules_updated_at
  BEFORE UPDATE ON guardian_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_vault_secrets_updated_at
  BEFORE UPDATE ON vault_secrets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE leverage_logs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read/write all tables
CREATE POLICY "auth_all_projects" ON projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_project_assets" ON project_assets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_tasks" ON tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_read_audit_logs" ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_audit_logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_all_system_config" ON system_config FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_guardian_rules" ON guardian_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_vault_secrets" ON vault_secrets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_leverage_logs" ON leverage_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO system_config (key, value) VALUES
  ('agent_sync_interval', '"300"'::jsonb),
  ('guardian_mode', '"active"'::jsonb),
  ('auto_pr_enabled', 'true'::jsonb),
  ('last_agent_sync', '"never"'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO guardian_rules (name, description, pattern, severity) VALUES
  ('Missing createdById', 'Flag entities without createdById audit fields', 'missing_created_by', 'Warning'),
  ('Hard-coded strings', 'No hard-coded strings in frontend components', 'hardcoded_strings', 'Warning'),
  ('Identity Fragmentation', 'Detect mismatched user identity references across tables', 'identity_fragmentation', 'Critical'),
  ('Untyped API Response', 'API endpoints returning untyped responses', 'untyped_api_response', 'Warning'),
  ('Missing RLS Policy', 'Tables without Row Level Security policies', 'missing_rls', 'Critical')
ON CONFLICT DO NOTHING;
