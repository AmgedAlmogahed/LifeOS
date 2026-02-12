# PHASE 1 UX SPECIFICATION — LifeOS Cockpit/Focus/Plan

**Status:** Implementation Ready
**Owner:** Rabwa
**Date:** February 12, 2026
**Version:** 1.0.0
**Target:** 4 weeks

---

## 1. Overview & Goals

### 1.1 What Phase 1 Delivers

Phase 1 is the **Ritual Core** — the daily cycle that holds the system together. It delivers:

- **Cockpit (Home)** — All projects at a glance with AI recommendation
- **Focus Mode (Deep Work)** — Full-screen, single-project workspace with automatic session tracking
- **Evening Plan** — Nightly ritual for review, commitment, and delegation
- **Quick Capture** — Global overlay for zero-friction interruption handling
- **Contextual Top Bar** — No sidebar; navigation adapts to the current mode

By the end of Phase 1:
- User enters app → sees Cockpit with all projects and a recommendation
- Clicks a project → enters Focus Mode with full context (timeline, last session, tasks)
- At 6 PM → Evening Plan nudges them to review today and commit to tomorrow
- Can capture thoughts/interruptions from anywhere without losing focus
- All this works without a sidebar; top bar shows contextual info for the current mode

### 1.2 Success Criteria

✅ User can see all active projects in Cockpit
✅ User can enter Focus Mode with one click and get full context
✅ Focus sessions are automatically tracked (start/end times)
✅ User can capture a thought in < 5 seconds and return to Focus
✅ Evening Plan ritual takes 10-15 minutes end-to-end
✅ No sidebar; top bar changes based on mode
✅ Task commitment (to dates) and migration (to future dates) work
✅ Simple AI recommendation (deadline-based) works
✅ Inbox shows captures + unplanned tasks

### 1.3 What's NOT in Phase 1

❌ Complex AI task breakdown (Phase 4)
❌ OpenClaw delegation execution (Phase 4)
❌ Health score computation (Phase 3)
❌ Client context panel details (Phase 2)
❌ Finance cross-cutting views (Phase 2)
❌ Calendar integration (Phase 5)
❌ Personal goals/habits (Phase 5)

---

## 2. Database Migrations

### 2.1 New Tables

#### Table: `focus_sessions`
Tracks focused work on projects. Automatically created when entering Focus mode.

```sql
CREATE TABLE focus_sessions (
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

CREATE INDEX idx_focus_sessions_project ON focus_sessions(project_id);
CREATE INDEX idx_focus_sessions_user ON focus_sessions(user_id);
CREATE INDEX idx_focus_sessions_started ON focus_sessions(started_at DESC);
```

#### Table: `daily_plans`
Stores the nightly commitment — which projects, which tasks.

```sql
CREATE TABLE daily_plans (
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

CREATE INDEX idx_daily_plans_date ON daily_plans(plan_date DESC);
CREATE INDEX idx_daily_plans_user ON daily_plans(user_id);
```

#### Table: `quick_captures`
Raw inbox entries before categorization. Captures go here first.

```sql
CREATE TABLE quick_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  raw_text TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'web',
  status TEXT NOT NULL DEFAULT 'captured',

  created_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_quick_captures_user ON quick_captures(user_id);
CREATE INDEX idx_quick_captures_status ON quick_captures(status);
CREATE INDEX idx_quick_captures_created ON quick_captures(created_at DESC);
```

#### Table: `health_snapshots`
Manual health score placeholders for Phase 1. Later auto-computed (Phase 3).

```sql
CREATE TABLE health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  snapshot_date DATE NOT NULL,
  dimension TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  components JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, snapshot_date, dimension)
);

CREATE INDEX idx_health_snapshots_user_date ON health_snapshots(user_id, snapshot_date DESC);
```

### 2.2 Modifications to Existing Tables

#### Table: `tasks`
Add Phase 1 ritual fields (some already in schema.sql, verify):

```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS committed_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS migrated_from UUID REFERENCES tasks(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS delegated_to TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS delegation_status TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS delegation_notes TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tasks_committed_date ON tasks(committed_date);
CREATE INDEX IF NOT EXISTS idx_tasks_delegated_to ON tasks(delegated_to);
```

#### Table: `projects`
Add fields for Focus Mode context:

```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
```

### 2.3 RLS Policies (Add to Schema)

```sql
-- focus_sessions
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own focus sessions" ON focus_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own focus sessions" ON focus_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own focus sessions" ON focus_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- daily_plans
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own daily plans" ON daily_plans
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own daily plans" ON daily_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily plans" ON daily_plans
  FOR UPDATE USING (auth.uid() = user_id);

-- quick_captures
ALTER TABLE quick_captures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own captures" ON quick_captures
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own captures" ON quick_captures
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own captures" ON quick_captures
  FOR UPDATE USING (auth.uid() = user_id);

-- health_snapshots
ALTER TABLE health_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own health snapshots" ON health_snapshots
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own health snapshots" ON health_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## 3. TypeScript Type Definitions

Add to `/src/types/database.ts`:

```typescript
// ─── Focus Sessions ──────────────────────────────────────────────────────

export interface FocusSession {
  id: string;
  project_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  session_notes: string | null;
  tasks_completed: number;
  created_at: string;
  updated_at: string;
}

export type FocusSessionInsert = Omit<FocusSession, "id" | "created_at" | "updated_at">;
export type FocusSessionUpdate = Partial<Omit<FocusSession, "id" | "created_at" | "updated_at">>;

// ─── Daily Plans ─────────────────────────────────────────────────────────

export interface DailyPlan {
  id: string;
  plan_date: string;
  user_id: string;
  reflection_notes: string | null;
  plan_notes: string | null;
  ai_recommendation_text: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export type DailyPlanInsert = Omit<DailyPlan, "id" | "created_at" | "updated_at">;
export type DailyPlanUpdate = Partial<Omit<DailyPlan, "id" | "created_at" | "updated_at">>;

// ─── Quick Captures ──────────────────────────────────────────────────────

export type CaptureSource = 'web' | 'telegram' | 'voice' | 'agent';
export type CaptureStatus = 'captured' | 'processed' | 'dismissed';

export interface QuickCapture {
  id: string;
  user_id: string;
  raw_text: string;
  source: CaptureSource;
  status: CaptureStatus;
  created_task_id: string | null;
  processed_at: string | null;
  created_at: string;
}

export type QuickCaptureInsert = Omit<QuickCapture, "id" | "created_at" | "processed_at">;
export type QuickCaptureUpdate = Partial<Omit<QuickCapture, "id" | "created_at">>;

// ─── Health Snapshots ────────────────────────────────────────────────────

export type HealthDimension = 'financial' | 'business' | 'operations' | 'personal';

export interface HealthSnapshot {
  id: string;
  user_id: string;
  snapshot_date: string;
  dimension: HealthDimension;
  score: number;
  components: Record<string, number> | null;
  created_at: string;
}

export type HealthSnapshotInsert = Omit<HealthSnapshot, "id" | "created_at">;
```

---

## 4. Cockpit Screen

**Route:** `/cockpit`
**Purpose:** Home showing all projects with AI recommendation

### 4.1 Layout Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  LifeOS                              🌙 Plan    📥 3    [+ Cpt]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✨ AI Recommendation                                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Focus on Project Alpha                                    │  │
│  │ Deadline in 5 days, 3 tasks ready                         │  │
│  │ [Enter Focus]                                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  📋 All Active Projects (4)                                     │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │ PROJECT ALPHA │  │ PROJECT BETA  │  │ PROJECT GAMMA │       │
│  │ ACME Corp     │  │ StartupXYZ    │  │ Personal Site │       │
│  │ [Timeline]    │  │ [Timeline]    │  │ [Timeline]    │       │
│  │ Building      │  │ Testing       │  │ Planning      │       │
│  │ 5 days        │  │ 12 days       │  │ 30 days       │       │
│  │ [Enter Focus] │  │ [Enter Focus] │  │ [Enter Focus] │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
│                                                                  │
│  📊 Financial Snapshot                                          │
│  Outstanding: $4,800  Revenue this month: $12,400              │
│                                                                  │
│  📌 Personal Tasks Queue (5)                                    │
│  □ Call mom  □ Renew insurance  □ Book dentist                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Queries

```typescript
// Query 1: All active projects
SELECT p.* FROM projects p
WHERE p.status IN ('Document', 'Freeze', 'Implement', 'Verify')
ORDER BY p.updated_at DESC;

// Query 2: Last focus session per project
SELECT DISTINCT ON (project_id) * FROM focus_sessions
WHERE user_id = $userId AND project_id = $projectId
ORDER BY project_id, started_at DESC LIMIT 1;

// Query 3: Current lifecycle stage
SELECT * FROM lifecycles WHERE project_id = $projectId
ORDER BY created_at DESC LIMIT 1;

// Query 4: Task counts
SELECT COUNT(*) FILTER (WHERE status != 'Done') as todo,
       COUNT(*) FILTER (WHERE status = 'Blocked') as blocked
FROM tasks WHERE project_id = $projectId;

// Query 5: Financial snapshot
SELECT COALESCE(SUM(amount), 0) as outstanding
FROM invoices WHERE status IN ('Pending', 'Overdue');

// Query 6: Personal tasks
SELECT * FROM tasks WHERE project_id IS NULL
AND status != 'Done' ORDER BY due_date ASC LIMIT 5;
```

---

## 5. Focus Mode Screen

**Route:** `/focus/[projectId]`
**Purpose:** Full-screen deep work on one project

### 5.1 Layout Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Cockpit    PROJECT ALPHA · ACME Corp         📥    [+ Cpt]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SESSION BANNER                                                  │
│  Started 2 hours ago | Last: Completed signup                  │
│  [Leave notes before exiting]                                   │
│                                                                  │
│  PROJECT TIMELINE                                                │
│  [Understand] [Document] [Building ← YOU] [Testing] [Done]      │
│  Deadline: 5 days  Progress: 60%                                │
│                                                                  │
│  ┌──────────────────────────┐  ┌────────────────────────────────┐│
│  │ PRIORITIZED TASKS        │  │ CONTEXT PANEL                  ││
│  │ ✅ Login API endpoint    │  │ 👤 ACME Corp                   ││
│  │ □ Auth middleware       │  │ 💰 This project: $8k / $15k    ││
│  │ □ Login form            │  │ 🚀 Staging: https://staging    ││
│  │ ⛔ Session storage      │  │                                ││
│  │ □ Logout endpoint       │  │                                ││
│  │                          │  │                                ││
│  │ [+ Add] [? Ask AI]       │  │                                ││
│  └──────────────────────────┘  └────────────────────────────────┘│
│                                                                  │
│  [← Back to Cockpit]     [Exit Focus & Save Notes]             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Key Interactions

**Load /focus/[projectId]**
```
1. Validate project exists
2. Create/reuse focus_session record
3. Fetch project, lifecycle, last session, tasks, client, deployment
4. Display full context
```

**Click checkbox to complete task**
```
1. Call updateTask(taskId, { status: 'Done', completed_at: NOW() })
2. Strikethrough task visually
3. Increment session.tasks_completed
```

**Click [Block] on task**
```
1. Toggle task.status between 'Blocked' and 'Todo'
2. Move blocked tasks to top
```

**Exit Focus mode**
```
1. Modal: "Leave session notes (optional)?"
2. Click Save: call endFocusSession(sessionId, notes)
3. Navigate back to /cockpit
```

---

## 6. Evening Plan Screen

**Route:** `/plan`
**Purpose:** 10-15 min nightly ritual

### 6.1 Layout Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Cockpit     🌙 Evening Plan          📥    [+ Cpt]           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📊 TODAY'S REVIEW                                               │
│  ✅ 5 tasks completed | 📝 2 in progress | ⏱️ 6h 45m focus time  │
│                                                                  │
│  ✨ AI RECOMMENDATION FOR TOMORROW                              │
│  Morning: Project Alpha (deadline in 4 days)                    │
│  Afternoon: Project Beta (continue payment flow)                │
│  [Accept] [Edit]                                               │
│                                                                  │
│  📋 TASK COMMITMENT FOR TOMORROW                                │
│  ┌─ Morning (Project Alpha) ──────────────────────────────┐   │
│  │ □ Session storage integration                          │   │
│  │ □ Logout endpoint                                      │   │
│  │ [+ Add task]                                          │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ Afternoon (Project Beta) ─────────────────────────────┐   │
│  │ □ Payment validation logic                             │   │
│  │ [+ Add task]                                          │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                  │
│  📥 CAPTURE TRIAGE (3 items)                                    │
│  "Help brother with printer"                                   │
│  [→ Task] [→ Personal] [💼 Delegate] [✕ Dismiss]               │
│                                                                  │
│  [✅ Complete Plan] [← Back]                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Key Interactions

**Load /plan**
```
1. Fetch today's focus sessions
2. Fetch completed tasks today
3. Compute AI recommendation
4. Fetch unprocessed captures
5. Display all sections
```

**Convert capture to task**
```
1. Open modal: "Which project?"
2. User selects project or "Personal"
3. Call createTaskFromCapture()
4. Remove from captures, add to commitment section
```

**Complete plan**
```
1. Validate at least 1 task committed
2. Call completeDailyPlan()
3. Show success toast
4. Navigate to /cockpit
```

---

## 7. Quick Capture

**Route:** Global overlay
**Access:** Cmd+K, FAB button, or Telegram

### 7.1 Workflow

```
User in Focus mode
↓
Hits Cmd+K
↓
Modal opens, textarea focused
↓
Types: "Call mom about dinner"
↓
Hits Enter or clicks [Capture]
↓
Toast: "Captured ✓"
↓
Modal closes, back to Focus mode
```

### 7.2 Component

```typescript
interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (text: string) => void;
}

// Modal with textarea
// Keyboard: Enter to submit, Escape to close
// Disabled button if empty
// Max 500 characters
```

---

## 8. Inbox Screen

**Route:** `/inbox`
**Purpose:** Process captures + unplanned tasks

### 8.1 Sections

1. **Unprocessed Captures** — Raw text entries
2. **Unplanned Tasks** — Tasks without project
3. **Processed History** — Last 7 days

### 8.2 Actions

- [→ Task] — Convert to task, select project
- [→ Personal] — Convert to personal task
- [💼 Delegate] — Mark for delegation (Phase 4)
- [✕ Dismiss] — Mark as dismissed

---

## 9. Contextual Top Bar

**Three variants** based on current mode:

### Cockpit Variant
```
LifeOS    🌙 Plan    📥 3    [+ Cpt]
```

### Focus Variant
```
← Cockpit    PROJECT ALPHA · ACME Corp    📥 [+ Cpt]
```

### Plan Variant
```
← Cockpit    🌙 Evening Plan    📥 [+ Cpt]
```

### Component Spec

```typescript
interface ContextBarProps {
  mode: 'cockpit' | 'focus' | 'plan';
  projectName?: string;
  clientName?: string;
  inboxCount?: number;
  onBack?: () => void;
  onCapture?: () => void;
}

// Fixed height: 56px
// Sticky at top, z-index: 40
// No sidebar (this IS the navigation)
```

---

## 10. App Shell Updates

**File:** `/src/components/layout/app-shell.tsx`

### Changes

- Remove `<AppSidebar />`
- Add `<ContextBar />`
- Keep `<QuickCaptureButton />`
- Keep `<QuickCaptureModal />`
- Add shortcut listener for Cmd+K

### Layout

```
<TooltipProvider>
  <CaptureProvider>
    <div className="flex flex-col h-screen">
      <ContextBar />
      <main className="flex-1 overflow-auto">
        {children}
        <QuickCaptureButton />
      </main>
      <QuickCaptureModal />
    </div>
  </CaptureProvider>
</TooltipProvider>
```

### Delete

- `/src/components/layout/app-sidebar.tsx`

---

## 11. Server Actions

### 11.1 `/src/lib/actions/focus-sessions.ts`

```typescript
export async function createFocusSession(projectId: string);
export async function endFocusSession(sessionId: string, notes: string | null);
export async function getActiveFocusSession(projectId: string);
export async function getLastCompletedSession(projectId: string);
export async function incrementSessionTaskCount(sessionId: string);
```

### 11.2 `/src/lib/actions/daily-plans.ts`

```typescript
export async function getOrCreateDailyPlan(planDate: string);
export async function updateDailyPlan(planId: string, update: DailyPlanUpdate);
export async function completeDailyPlan(planId: string);
```

### 11.3 `/src/lib/actions/captures.ts`

```typescript
export async function createCapture(capture: QuickCaptureInsert);
export async function dismissCapture(captureId: string);
export async function processCapture(captureId: string, processedTaskId?: string);
export async function getUnprocessedCaptures();
```

### 11.4 `/src/lib/actions/recommendations.ts`

```typescript
export async function generateRecommendation(): Promise<{
  recommendedProject: Project;
  reason: string;
}>;
```

**Algorithm:**
```
Score = (daysUntilDeadline * 40%)
      + (overdueTaskCount * 20%)
      + (daysSinceLastSession * 20%)
      + (blockedTaskCount * 10%)
      + (urgentComms * 10%)

Highest score wins and is recommended
```

---

## 12. Pages to Create

- `/src/app/cockpit/page.tsx`
- `/src/app/focus/[projectId]/page.tsx`
- `/src/app/plan/page.tsx`
- `/src/app/inbox/page.tsx`

---

## 13. Components to Create

**Cockpit Components:**
- `RecommendationBanner`
- `ProjectCard`
- `ProjectTimeline`
- `FinancialSnapshot`
- `PersonalTasksQueue`

**Focus Components:**
- `FocusSessionBanner`
- `TaskList`
- `TaskItem`
- `ContextPanel`

**Plan Components:**
- `TodayReview`
- `AIRecommendation`
- `TaskCommitment`
- `CaptureTriage`

**Inbox Components:**
- `CaptureItem`
- `UnplannedTaskItem`

**Layout Components:**
- `ContextBar`
- `ContextBarCockpit`
- `ContextBarFocus`
- `ContextBarPlan`

---

## 14. API Routes

- `GET /api/inbox/count` — Return count of unprocessed captures + unplanned tasks

---

## 15. Migration Order

1. Database migrations (tables, policies)
2. Update types in `/src/types/database.ts`
3. Create server actions
4. Create reusable components
5. Update app-shell, remove sidebar
6. Create context bar component
7. Create pages (cockpit, focus, plan, inbox)
8. Test all workflows

---

## 16. Date Utilities

```typescript
export function daysUntil(date: Date): number;
export function daysSince(date: Date): number;
export function formatDuration(ms: number): string;
export function isAfter6PM(): boolean;
```

---

## 17. Color Palette

```
Status colors:
- Done: Green (hsl(142, 76%, 36%))
- Todo: Blue (hsl(217, 91%, 60%))
- Blocked: Red (hsl(0, 84%, 60%))
- InProgress: Amber (hsl(38, 92%, 50%))
```

---

## 18. Animations

- Page transitions: Fade in (200ms)
- Task completion: Strikethrough (200ms)
- Capture modal: Slide up (300ms)
- Inbox badge: Pulse if count > 0 (500ms)

---

## 19. Testing Checklist

**Cockpit:**
- [ ] Load with 3+ projects
- [ ] Recommendation correct
- [ ] Click project → enters focus
- [ ] Inbox badge correct count

**Focus Mode:**
- [ ] Session banner shows time
- [ ] Last session notes appear
- [ ] Complete task → strikethrough
- [ ] Exit → notes modal
- [ ] Back → returns to cockpit

**Plan:**
- [ ] Load today summary
- [ ] AI recommendation displays
- [ ] Convert capture to task
- [ ] Complete plan → saved

**Capture:**
- [ ] Cmd+K opens modal
- [ ] Submit → closes modal
- [ ] Inbox badge incremented

---

## 20. Performance Targets

| Metric | Target |
|--------|--------|
| Cockpit load | < 1s |
| Focus enter | < 500ms |
| Task completion | < 200ms |
| Capture submit | < 300ms |

---

## 21. Accessibility

- All buttons have ARIA labels
- Keyboard navigation (Tab, Enter)
- Focus visible on all elements
- Color + icons (not color alone)
- Screen reader announcements

---

## Summary

**Database:** 4 new tables, RLS policies
**Code:** Remove sidebar, add context bar, 4 pages, 15+ components, 4 action files
**Routes:** `/cockpit`, `/focus/[id]`, `/plan`, `/inbox`
**Timeframe:** 4 weeks

This specification is complete and implementation-ready. Every screen has a wireframe, every component has specs, every interaction is defined.
