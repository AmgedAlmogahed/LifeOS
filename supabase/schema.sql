-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║                     Life OS — Database Schema                               ║
-- ║                     Run this in your Supabase SQL Editor                     ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ─── Custom Enum Types ─────────────────────────────────────────────────────────

CREATE TYPE project_status AS ENUM (
  'Backlog', 'Understand', 'Document', 'Freeze', 'Implement', 'Verify'
);

CREATE TYPE task_status AS ENUM (
  'Todo', 'In Progress', 'Done', 'Blocked'
);

CREATE TYPE task_priority AS ENUM (
  'Critical', 'High', 'Medium', 'Low'
);

CREATE TYPE audit_level AS ENUM (
  'Critical', 'Warning', 'Info'
);

-- ─── Projects Table ────────────────────────────────────────────────────────────

CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  status      project_status NOT NULL DEFAULT 'Backlog',
  progress    INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  last_audit_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Tasks Table ───────────────────────────────────────────────────────────────

CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  status      task_status NOT NULL DEFAULT 'Todo',
  priority    task_priority NOT NULL DEFAULT 'Medium',
  due_date    DATE,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Audit Logs Table ──────────────────────────────────────────────────────────

CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level       audit_level NOT NULL DEFAULT 'Info',
  message     TEXT NOT NULL,
  source      TEXT NOT NULL DEFAULT 'System',
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── System Config Table ───────────────────────────────────────────────────────

CREATE TABLE system_config (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_audit_logs_level ON audit_logs(level);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_projects_status ON projects(status);

-- ─── Updated At Trigger ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at
  BEFORE UPDATE ON system_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users (full read, write through authenticated role)
CREATE POLICY "Authenticated users can read projects"
  ON projects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage projects"
  ON projects FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read tasks"
  ON tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage tasks"
  ON tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read audit logs"
  ON audit_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can read system config"
  ON system_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage system config"
  ON system_config FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Service role bypasses RLS automatically, so agent API writes just work.

-- ─── Seed Data ─────────────────────────────────────────────────────────────────

INSERT INTO system_config (key, value) VALUES
  ('auto_pr_enabled', '{"enabled": true, "description": "Automatically create PRs from agent changes"}'),
  ('agent_sync_interval', '{"seconds": 300, "description": "How often Son of Anton syncs data"}'),
  ('guardian_mode', '{"enabled": true, "description": "Enable critical alert monitoring"}');
