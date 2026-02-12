-- Sprints Table
CREATE TABLE IF NOT EXISTS sprints (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sprint_number   INTEGER NOT NULL,
  goal            TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'active', -- 'planning' | 'active' | 'completed' | 'cancelled'
  started_at      DATE NOT NULL,
  planned_end_at  DATE NOT NULL,
  ended_at        DATE,

  -- Velocity metrics (captured at sprint close)
  planned_task_count   INTEGER DEFAULT 0,
  completed_task_count INTEGER DEFAULT 0,
  planned_points       INTEGER DEFAULT 0,
  completed_points     INTEGER DEFAULT 0,
  scope_changes        INTEGER DEFAULT 0,

  -- Reflection
  sprint_note     TEXT,
  focus_time_minutes INTEGER DEFAULT 0,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(project_id, sprint_number)
);

CREATE INDEX IF NOT EXISTS idx_sprints_project ON sprints(project_id);
CREATE INDEX IF NOT EXISTS idx_sprints_user ON sprints(user_id);
CREATE INDEX IF NOT EXISTS idx_sprints_status ON sprints(status);
CREATE INDEX IF NOT EXISTS idx_sprints_dates ON sprints(started_at, planned_end_at);

-- Trigger for updated_at on sprints
CREATE TRIGGER trg_sprints_updated_at
  BEFORE UPDATE ON sprints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS for sprints
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sprints" ON sprints
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tasks Table Updates for Sprints
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS story_points INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS added_to_sprint_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tasks_sprint ON tasks(sprint_id);

-- Tasks Table Updates for Flow Board
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS skip_count INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS time_spent_minutes INTEGER DEFAULT 0;
