-- 2.1 New Tables

CREATE TABLE IF NOT EXISTS focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  session_notes TEXT,
  tasks_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_project ON focus_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_started ON focus_sessions(started_at DESC);

CREATE TABLE IF NOT EXISTS daily_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_date DATE NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reflection_notes TEXT,
  plan_notes TEXT,
  ai_recommendation_text TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_plans_date ON daily_plans(plan_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_plans_user ON daily_plans(user_id);

CREATE TABLE IF NOT EXISTS quick_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,

  -- Using text instead of enum for flexibility, or enum type if preferred
  source TEXT NOT NULL DEFAULT 'web', 
  status TEXT NOT NULL DEFAULT 'captured',

  created_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quick_captures_user ON quick_captures(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_captures_status ON quick_captures(status);
CREATE INDEX IF NOT EXISTS idx_quick_captures_created ON quick_captures(created_at DESC);

CREATE TABLE IF NOT EXISTS health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  dimension TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  components JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, snapshot_date, dimension)
);

CREATE INDEX IF NOT EXISTS idx_health_snapshots_user_date ON health_snapshots(user_id, snapshot_date DESC);

-- 2.2 Modifications

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS committed_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS migrated_from UUID REFERENCES tasks(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS delegated_to TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS delegation_status TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS delegation_notes TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tasks_committed_date ON tasks(committed_date);
CREATE INDEX IF NOT EXISTS idx_tasks_delegated_to ON tasks(delegated_to);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);

-- 2.3 RLS Policies

ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_snapshots ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  -- Focus Sessions
  DROP POLICY IF EXISTS "Users can see own focus sessions" ON focus_sessions;
  CREATE POLICY "Users can see own focus sessions" ON focus_sessions FOR SELECT USING (auth.uid() = user_id);
  
  DROP POLICY IF EXISTS "Users can create own focus sessions" ON focus_sessions;
  CREATE POLICY "Users can create own focus sessions" ON focus_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
  
  DROP POLICY IF EXISTS "Users can update own focus sessions" ON focus_sessions;
  CREATE POLICY "Users can update own focus sessions" ON focus_sessions FOR UPDATE USING (auth.uid() = user_id);

  -- Daily Plans
  DROP POLICY IF EXISTS "Users can see own daily plans" ON daily_plans;
  CREATE POLICY "Users can see own daily plans" ON daily_plans FOR SELECT USING (auth.uid() = user_id);
  
  DROP POLICY IF EXISTS "Users can create own daily plans" ON daily_plans;
  CREATE POLICY "Users can create own daily plans" ON daily_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
  
  DROP POLICY IF EXISTS "Users can update own daily plans" ON daily_plans;
  CREATE POLICY "Users can update own daily plans" ON daily_plans FOR UPDATE USING (auth.uid() = user_id);

  -- Quick Captures
  DROP POLICY IF EXISTS "Users can see own captures" ON quick_captures;
  CREATE POLICY "Users can see own captures" ON quick_captures FOR SELECT USING (auth.uid() = user_id);
  
  DROP POLICY IF EXISTS "Users can create own captures" ON quick_captures;
  CREATE POLICY "Users can create own captures" ON quick_captures FOR INSERT WITH CHECK (auth.uid() = user_id);
  
  DROP POLICY IF EXISTS "Users can update own captures" ON quick_captures;
  CREATE POLICY "Users can update own captures" ON quick_captures FOR UPDATE USING (auth.uid() = user_id);

  -- Health Snapshots
  DROP POLICY IF EXISTS "Users can see own health snapshots" ON health_snapshots;
  CREATE POLICY "Users can see own health snapshots" ON health_snapshots FOR SELECT USING (auth.uid() = user_id);
  
  DROP POLICY IF EXISTS "Users can create own health snapshots" ON health_snapshots;
  CREATE POLICY "Users can create own health snapshots" ON health_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
  
EXCEPTION
  WHEN others THEN NULL;
END $$;
