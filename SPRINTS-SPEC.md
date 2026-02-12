# LifeOS — Sprint System Specification

> **Status:** Design Ready — Needs Review Before Implementation
> **Owner:** Rabwa
> **Date:** February 12, 2026
> **Context:** Fills the gap between lifecycle stages (macro) and daily task commitment (micro)

---

## 1. What Problem Sprints Solve

LifeOS currently has two planning layers:

```
MACRO  ──── Lifecycle Stages (Requirements → Building → Testing → Deploying)
             Scope: entire project phase. Duration: weeks to months.

MICRO  ──── Daily Plan (tonight's commitment ritual)
             Scope: tomorrow's tasks. Duration: 1 day.

  ❌ GAP ──── No mid-range planning. No 1-2 week target. No velocity data.
              No scope protection from new requests.
```

Sprints fill the gap:

```
MACRO  ──── Lifecycle Stages
MESO   ──── Sprints (1-2 week cycles per project)    ← NEW
MICRO  ──── Daily Plan
```

## 2. What a Sprint IS in LifeOS

A sprint is a **time-boxed commitment cycle** for a single project. It answers three questions:

1. **What am I trying to accomplish?** → Sprint Goal
2. **What specific tasks will I complete?** → Sprint Backlog
3. **How much did I actually get done?** → Velocity

### What It Is NOT

- Not Scrum. No standups, no scrum master, no team ceremonies.
- Not rigid. You can adjust mid-sprint if priorities change (but it's logged).
- Not required. Personal tasks and non-project work don't need sprints.
- Not another tool to maintain. Sprint creation takes < 2 minutes.

---

## 3. Sprint Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  ① PLAN         ② EXECUTE         ③ REVIEW                  │
│  (2-5 min)      (1-2 weeks)       (5-10 min)                │
│                                                               │
│  Set goal        Daily work         What got done?           │
│  Pull tasks      Complete tasks     What carried over?       │
│  Set duration    Scope protected    Velocity recorded        │
│                                                               │
│  ────────────►  ────────────────►  ────────────►            │
│                                       │                       │
│                                       ▼                       │
│                                  ① PLAN (next sprint)        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### ① Sprint Planning (2-5 minutes)

Happens in **Focus Mode** when starting a new sprint:

1. **Set a Sprint Goal** — One sentence: "Complete the auth system and connect Admin Panel login."
2. **Set Duration** — Default 2 weeks. Can be 1 week for urgent projects. Calendar picker for start/end.
3. **Pull Tasks** — Select tasks from the project backlog into this sprint. AI can suggest based on priority and dependencies.
4. **Estimate (optional)** — Assign point estimates to tasks (1 = trivial, 2 = small, 3 = medium, 5 = large, 8 = huge). Points are optional — task count works as a velocity metric too.

### ② Sprint Execution (1-2 weeks)

Normal daily workflow. The sprint adds these behaviors:

- **Tasks are organized by sprint membership**: Sprint tasks appear first in Focus mode, backlog tasks appear below a separator.
- **Scope protection**: New tasks added during a sprint go to the project backlog by default, NOT the active sprint. You can explicitly pull them into the sprint, but it's a conscious choice (and it's logged as "scope change").
- **Progress tracking**: Sprint progress bar updates in real-time as tasks are completed.
- **Daily Plan integration**: When committing tasks in the evening Plan, sprint tasks are highlighted/prioritized.

### ③ Sprint Review (5-10 minutes)

Triggered when the sprint end date arrives (or manually ended early):

1. **Completion Summary** — X of Y tasks done. Z points completed (if using points).
2. **Carry Forward Decision** — For each incomplete task: keep in next sprint, move to backlog, or drop.
3. **Velocity Record** — Tasks completed (and points if used) stored for trend tracking.
4. **Sprint Note** — Optional reflection: "Auth took longer than expected because Redis session management was more complex. Adjust estimates for similar work."
5. **Auto-prompt next sprint** — "Start Sprint 4?" with AI-suggested goal based on remaining backlog.

---

## 4. Where Sprints Surface in the UI

### 4.1 Cockpit — Project Card Enhancement

The project card gets a sprint indicator:

```
┌─────────────────────────────────┐
│ NOKHBAT PLATFORM                │
│ Nokhbat Al-Mabani               │
│                                  │
│ [Requirements] [Building ←] ... │
│                                  │
│ 🏃 Sprint 3 · Day 8 of 14      │
│ ████████░░░░ 7/12 tasks         │
│ Goal: Complete auth + Admin login│
│                                  │
│ ⏰ Deadline: Mar 15              │
│ [Enter Focus]                    │
└─────────────────────────────────┘
```

If no active sprint: show "No active sprint — [Start Sprint]" link.

### 4.2 Focus Mode — Sprint as Task Organizer

The task list in Focus mode is split by sprint:

```
┌──────────────────────────────────────────────┐
│ 🏃 SPRINT 3 — "Complete auth + Admin login"  │
│ Day 8 of 14 · 7/12 tasks · 18/31 points     │
│ ████████░░░░                                  │
├──────────────────────────────────────────────┤
│                                               │
│ SPRINT TASKS                                  │
│ ✅ JWT + Redis session management            │
│ ✅ Named Passport strategies                 │
│ ✅ Refresh token rotation                    │
│ ✅ Admin Panel login form connection         │
│ ✅ Login API endpoint                        │
│ ✅ Auth middleware                            │
│ ✅ Logout endpoint                           │
│ □  Session storage integration        [3 pts]│
│ □  Role-based route protection        [5 pts]│
│ ⛔ CASL permission setup (blocked)    [5 pts]│
│ □  Admin dashboard API connection     [3 pts]│
│ □  Auth error handling & UX           [2 pts]│
│                                               │
│ [+ Add to Sprint]                             │
│                                               │
├──────────────────────────────────────────────┤
│ BACKLOG (not in sprint)                       │
│ □ Build Customer/CRM module APIs       [5 pts]│
│ □ Build Sales & Booking APIs           [8 pts]│
│ □ Build Contracts module APIs          [5 pts]│
│ ... 12 more                                   │
│                                               │
│ [+ Add Task]  [? Ask AI to Break Down]        │
└──────────────────────────────────────────────┘
```

**Interactions:**
- Drag a backlog task into the sprint section → logged as scope change
- Click [+ Add to Sprint] → pick from backlog
- Complete a task → sprint progress updates instantly
- [End Sprint Early] button available in sprint header

### 4.3 Plan Mode — Sprint-Aware Evening Ritual

The daily Plan highlights sprint tasks:

```
📋 TASK COMMITMENT FOR TOMORROW

┌─ 🏃 Sprint 3 Tasks (prioritized) ──────────────┐
│ □ Session storage integration              [3] │
│ □ Role-based route protection              [5] │
│ □ CASL permission setup (unblock first!)   [5] │
│ [+ Pull from sprint]                           │
└────────────────────────────────────────────────┘

┌─ Other Tasks ───────────────────────────────────┐
│ □ Call mom about dinner                         │
│ □ Review hosting bill                           │
│ [+ Add task]                                    │
└─────────────────────────────────────────────────┘
```

### 4.4 Sprint Review — End of Sprint View

Accessed when sprint ends (or via Plan mode on sprint end date):

```
┌─────────────────────────────────────────────────┐
│ 🏁 SPRINT 3 REVIEW — Nokhbat Platform           │
│ Duration: Jan 27 – Feb 9 (14 days)              │
├─────────────────────────────────────────────────┤
│                                                  │
│ 📊 RESULTS                                      │
│ Tasks completed: 9 / 12 (75%)                   │
│ Points completed: 23 / 31 (74%)                 │
│ Focus time: 42 hours                             │
│                                                  │
│ 📈 VELOCITY TREND                               │
│ Sprint 1: 18 pts  Sprint 2: 21 pts  Sprint 3: 23│
│ ▁▃▅ Trending up ↑                               │
│                                                  │
│ 📝 INCOMPLETE TASKS (3)                         │
│ □ CASL permission setup        → [Next Sprint]  │
│ □ Admin dashboard API          → [Next Sprint]  │
│ □ Auth error handling          → [Backlog]       │
│                                                  │
│ Scope changes during sprint: +2 tasks added      │
│                                                  │
│ 💭 SPRINT NOTE (optional)                        │
│ ┌─────────────────────────────────────────────┐ │
│ │ Auth system was more complex than expected.  │ │
│ │ Redis session handling needs its own task    │ │
│ │ breakdown next time.                         │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ [Start Sprint 4]  [Back to Cockpit]             │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 5. Database Schema

### 5.1 New Table: `sprints`

```sql
CREATE TABLE IF NOT EXISTS sprints (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sprint_number   INTEGER NOT NULL,
  goal            TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'active',
    -- 'planning' | 'active' | 'completed' | 'cancelled'
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

CREATE INDEX idx_sprints_project ON sprints(project_id);
CREATE INDEX idx_sprints_user ON sprints(user_id);
CREATE INDEX idx_sprints_status ON sprints(status);
CREATE INDEX idx_sprints_dates ON sprints(started_at, planned_end_at);

CREATE TRIGGER trg_sprints_updated_at
  BEFORE UPDATE ON sprints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sprints" ON sprints
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 5.2 Modification: `tasks` table

```sql
-- Link tasks to sprints
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS story_points INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS added_to_sprint_at TIMESTAMPTZ;
  -- When the task was pulled into the sprint. If after sprint start → scope change.

CREATE INDEX IF NOT EXISTS idx_tasks_sprint ON tasks(sprint_id);
```

### 5.3 TypeScript Types

```typescript
// Add to database.ts or supabase types

export interface Sprint {
  id: string;
  project_id: string;
  user_id: string;
  sprint_number: number;
  goal: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  started_at: string;
  planned_end_at: string;
  ended_at: string | null;
  planned_task_count: number;
  completed_task_count: number;
  planned_points: number;
  completed_points: number;
  scope_changes: number;
  sprint_note: string | null;
  focus_time_minutes: number;
  created_at: string;
  updated_at: string;
}

export type SprintInsert = Omit<Sprint, 'id' | 'created_at' | 'updated_at'>;
export type SprintUpdate = Partial<Omit<Sprint, 'id' | 'created_at' | 'updated_at'>>;
```

---

## 6. Server Actions

### 6.1 `/src/lib/actions/sprints.ts`

```typescript
// Sprint CRUD
export async function createSprint(projectId: string, data: {
  goal: string;
  startedAt: string;      // date string
  plannedEndAt: string;    // date string
  taskIds: string[];       // tasks to pull into sprint
}): Promise<{ id: string; sprint_number: number }>;

export async function getActiveSprint(projectId: string): Promise<Sprint | null>;

export async function getSprintHistory(projectId: string): Promise<Sprint[]>;

// Sprint task management
export async function addTaskToSprint(taskId: string, sprintId: string): void;
  // Sets sprint_id on task, sets added_to_sprint_at = now()
  // If sprint.started_at < now(), increment sprint.scope_changes

export async function removeTaskFromSprint(taskId: string): void;
  // Clears sprint_id and added_to_sprint_at

// Sprint completion
export async function completeSprint(sprintId: string, data: {
  note: string | null;
  carryForwardTaskIds: string[];  // tasks that move to next sprint
  backlogTaskIds: string[];       // tasks that return to backlog
}): Promise<void>;
  // Calculates final velocity, stores metrics, sets status = 'completed'

export async function cancelSprint(sprintId: string): Promise<void>;
  // Clears sprint_id on all tasks, sets status = 'cancelled'

// Velocity
export async function getVelocityTrend(projectId: string, lastN?: number): Promise<{
  sprint_number: number;
  completed_task_count: number;
  completed_points: number;
  focus_time_minutes: number;
}[]>;
```

---

## 7. AI Integration Points

### 7.1 Sprint Planning Suggestions

When starting a new sprint, AI can suggest:

- **Sprint goal** based on lifecycle stage and upcoming deadlines
- **Which tasks to pull** based on priority, dependencies, and estimated velocity
- **Duration** — "You have a deadline in 10 days, suggest a 10-day sprint instead of 14"
- **Capacity warning** — "Your average velocity is 21 points. You're planning 35 points. Consider reducing scope."

### 7.2 Mid-Sprint Nudges

- **Falling behind**: "Day 10 of 14, 4/12 tasks done. Consider reducing scope or extending."
- **Ahead of schedule**: "7/8 tasks done with 5 days left. Pull more from backlog?"
- **Scope creep alert**: "3 tasks added mid-sprint. Original plan was 10 tasks."

### 7.3 Recommendation Engine Enhancement

The cockpit AI recommendation should factor in sprint data:

```
Updated Project Priority Score:
  - Days until deadline (30%)          ← reduced from 40%
  - Sprint progress vs time (25%)     ← NEW: behind on sprint = higher priority
  - Overdue tasks count (15%)         ← reduced from 20%
  - Days since last focus session (15%)← reduced from 20%
  - Blocked tasks count (10%)         ← unchanged
  - Unread client communications (5%) ← reduced from 10%
```

---

## 8. Scope Protection Rules

This is the key behavioral change that makes sprints valuable:

### During an active sprint:

| Action | Default Behavior |
|--------|-----------------|
| Create new task in Focus mode | Goes to **backlog**, NOT sprint |
| Quick Capture → convert to task | Goes to **backlog**, NOT sprint |
| AI task breakdown | Suggestions go to **backlog** |
| Manually add task to sprint | Allowed, but logged as **scope change** |
| Remove task from sprint | Allowed, but logged |
| Complete sprint task | Updates sprint progress |
| Block sprint task | Shows warning: "Blocked task may impact sprint goal" |

### Outside of a sprint:

All tasks go to the project backlog as usual. No sprint-related behavior.

---

## 9. Velocity Dashboard (Future — Phase 3 Reflection)

Eventually, the velocity data feeds into the reflection engine:

```
VELOCITY OVER TIME
Sprint 1: ▓▓▓▓▓▓░░░░░░░░ 18 pts (first sprint, learning)
Sprint 2: ▓▓▓▓▓▓▓░░░░░░░ 21 pts
Sprint 3: ▓▓▓▓▓▓▓▓░░░░░░ 23 pts (improving)
Sprint 4: ▓▓▓▓▓▓▓▓▓▓░░░░ 28 pts (hit stride)
Sprint 5: ▓▓▓▓▓▓░░░░░░░░ 17 pts (scope creep, 5 additions)

INSIGHTS
- Average velocity: 21.4 pts/sprint
- Best sprint: #4 (28 pts, zero scope changes)
- Scope changes correlate with lower velocity
- You complete ~75% of planned tasks on average
```

This data answers: "Am I getting faster? What disrupts my sprints? Can I trust my estimates?"

---

## 10. Implementation Approach

### What to build now (Phase 1 addition):

- `sprints` table + migration
- `sprint_id` and `story_points` columns on tasks
- `createSprint`, `getActiveSprint`, `completeSprint` server actions
- Sprint banner in Focus mode (goal, progress, days remaining)
- Sprint section in task list (sprint tasks vs backlog separator)
- Basic sprint planning flow (set goal, pick tasks, set dates)
- Sprint review screen (completion stats, carry forward)
- Sprint indicator on cockpit project card

### What to build later (Phase 3-4):

- AI sprint planning suggestions
- Mid-sprint nudges
- Velocity trend charts
- Capacity warnings
- Story points (start with task count only, add points when useful)

### Migration for coding agent:

```sql
-- Run this after the MIGRATION-AND-SEED.md tables are created

-- 1. Create sprints table
-- (Copy the SQL from Section 5.1 above)

-- 2. Add sprint columns to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS story_points INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS added_to_sprint_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_tasks_sprint ON tasks(sprint_id);

-- 3. Regenerate Supabase types
-- Run: npx supabase gen types typescript --project-id <project-id> > src/types/supabase.ts
```

---

## 11. Design Decisions

### Why per-project sprints (not global)?

You work on multiple projects. A global sprint forces you to split attention across projects in one cycle. Per-project sprints let you focus: "This sprint is about auth for Nokhbat. Next sprint might be about a different project entirely."

### Why 2 weeks default?

Long enough to accomplish something meaningful. Short enough that carrying forward doesn't feel like failure. You can shorten to 1 week for urgent work.

### Why story points are optional?

Task count is a simpler velocity metric that works for most solo devs. Points add precision ("building auth middleware is bigger than adding a logout button") but also add overhead. Start with task count. Add points when you feel task count isn't capturing effort accurately.

### Why log scope changes instead of blocking them?

Rigid scope protection creates frustration. A client emergency shouldn't be blocked by sprint rules. Instead, the system makes scope changes **visible** — you see "3 tasks added mid-sprint" in the review. Over time, the data shows you how scope changes affect velocity, which naturally motivates discipline without rigid enforcement.

---

*This spec should be reviewed before implementation. Key decision: start with task count only (simpler) or include story points from day one (more data)?*
