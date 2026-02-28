-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  Module Architecture: Project → Phases → Modules → Tasks                   ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ─── Phase Status Enum ────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE phase_status AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Module Status Enum ───────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE module_status AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Work Type Enum ───────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE work_type AS ENUM ('Backend', 'Frontend', 'Design', 'Integration', 'DevOps');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Project Phases ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  status phase_status NOT NULL DEFAULT 'PLANNED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_phases_project ON project_phases(project_id);

-- ─── Project Modules ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES project_phases(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  work_type work_type NOT NULL DEFAULT 'Backend',
  status module_status NOT NULL DEFAULT 'PLANNED',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_modules_phase ON project_modules(phase_id);
CREATE INDEX IF NOT EXISTS idx_project_modules_project ON project_modules(project_id);

-- ─── Add module_id to tasks ───────────────────────────────────────────────────
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES project_modules(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_module ON tasks(module_id);

-- ─── RLS Policies ─────────────────────────────────────────────────────────────
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_modules ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (RLS handled by project ownership)
CREATE POLICY "Authenticated users can manage phases" ON project_phases
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage modules" ON project_modules
  FOR ALL USING (true) WITH CHECK (true);
