-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  LIFE OS — ARCHITECT'S COMMAND CENTER                                      ║
-- ║  Database Migration: Module-Based Architecture (v3.0)                      ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ─── 1. Create Project Phases Table (The Skeleton) ──────────────────────────
CREATE TABLE IF NOT EXISTS project_phases (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  order_index INTEGER NOT NULL DEFAULT 0,
  start_date  DATE,
  end_date    DATE,
  status      TEXT NOT NULL DEFAULT 'Planned', -- Planned, Active, Completed, Delayed
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 2. Create Project Modules Table (The Work Units) ───────────────────────
CREATE TABLE IF NOT EXISTS project_modules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_id    UUID REFERENCES project_phases(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  start_date  DATE,
  end_date    DATE,
  progress    INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 3. Update Tasks Table for Module Architecture ─────────────────────────
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES project_modules(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES project_phases(id) ON DELETE SET NULL;

-- ─── 4. Task Category Enum (Work Types) ────────────────────────────────────
-- Note: 'Frontend', 'Backend', 'Integration', 'Testing', 'Deployment'
-- We'll use the existing metadata or a dedicated column.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS work_type TEXT CHECK (work_type IN ('Frontend', 'Backend', 'Integration', 'Testing', 'Deployment', 'Design', 'Audit', 'DevOps'));

-- ─── 5. Indexes for Fast Module/Phase Lookups ───────────────────────────────
CREATE INDEX IF NOT EXISTS idx_project_phases_project ON project_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_project_modules_project ON project_modules(project_id);
CREATE INDEX IF NOT EXISTS idx_project_modules_phase ON project_modules(phase_id);
CREATE INDEX IF NOT EXISTS idx_tasks_module ON tasks(module_id);
CREATE INDEX IF NOT EXISTS idx_tasks_phase ON tasks(phase_id);
CREATE INDEX IF NOT EXISTS idx_tasks_work_type ON tasks(work_type);

-- ─── 6. Triggers ────────────────────────────────────────────────────────────
CREATE TRIGGER trg_project_phases_updated_at
  BEFORE UPDATE ON project_phases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_project_modules_updated_at
  BEFORE UPDATE ON project_modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 7. RLS Policies ────────────────────────────────────────────────────────
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all_project_phases" ON project_phases FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_project_modules" ON project_modules FOR ALL TO authenticated USING (true) WITH CHECK (true);
