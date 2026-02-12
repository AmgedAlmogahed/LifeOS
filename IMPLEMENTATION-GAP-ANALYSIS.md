# LifeOS — Implementation Gap Analysis

> **Date:** February 12, 2026
> **Purpose:** Identify every gap between the approved specs and the current implementation
> **Specs Audited:** PHASE1-UX-SPEC.md, SPRINTS-SPEC.md, TASK-VIEW-SPEC.md
> **Verdict:** ~70% implemented. Critical gaps in Evening Plan, AI Recommendation, and Focus Session lifecycle.

---

## How to Read This Document

Each gap is categorized by severity:

- **P0 — Critical**: Core spec feature completely missing. Breaks the intended workflow.
- **P1 — High**: Feature exists but is a stub or fundamentally incomplete.
- **P2 — Medium**: Feature partially works but missing important spec behaviors.
- **P3 — Low**: Polish, edge case, or "build later" item from spec.

For each gap:
- **Spec Reference**: Which spec section defines the expected behavior
- **Current State**: What the code actually does right now
- **File(s)**: Exact files that need changes
- **Remediation**: Specific instructions for what to implement

---

## P0 — Critical Gaps

### GAP-01: Evening Plan is Gutted (2 textareas vs 5-section ritual)

**Spec Reference:** PHASE1-UX-SPEC.md Section 6.1

**Current State:** `plan-editor.tsx` contains only 2 textareas (reflection + plan notes) and a save/complete button. The spec defines a 5-section ritual that is the emotional heart of the system.

**File:** `src/app/(authenticated)/plan/plan-editor.tsx`

**What's Missing (all 4 sections below):**

#### Section 1 — Today's Review
The spec shows:
```
📊 TODAY'S REVIEW
✅ 5 tasks completed | 📝 2 in progress | ⏱️ 6h 45m focus time
```
**Remediation:** On `/plan` page load, fetch today's completed tasks (`tasks WHERE status='Done' AND completed_at::date = today`), in-progress tasks, and total focus session time (`SUM(ended_at - started_at) FROM focus_sessions WHERE started_at::date = today`). Display as a summary banner at the top before any textareas. This is read-only — not editable. It grounds the user in reality before planning.

#### Section 2 — AI Recommendation for Tomorrow
The spec shows:
```
✨ AI RECOMMENDATION FOR TOMORROW
Morning: Project Alpha (deadline in 4 days)
Afternoon: Project Beta (continue payment flow)
[Accept] [Edit]
```
**Remediation:** Call `generateRecommendation()` on page load (see GAP-02 for fixing the algorithm). Display the recommendation with Accept/Edit buttons. When accepted, store in `daily_plans.ai_recommendation_text`. Currently this field exists in the schema and the component shows it if present, but it's never populated.

#### Section 3 — Task Commitment for Tomorrow
The spec shows tasks grouped by project with checkboxes:
```
📋 TASK COMMITMENT FOR TOMORROW
┌─ Morning (Project Alpha) ────────────────┐
│ □ Session storage integration             │
│ □ Logout endpoint                         │
└───────────────────────────────────────────┘
```
**Remediation:** This is the most important missing section. Fetch all active projects and their uncompleted tasks. Let the user check tasks they commit to for tomorrow. On check, set `tasks.committed_date = tomorrow's date`. The `committed_date` column already exists in the schema (added in Phase 1 migration) but is NEVER used in any UI. Group committed tasks by project.

#### Section 4 — Capture Triage
The spec shows inline capture processing:
```
📥 CAPTURE TRIAGE (3 items)
"Help brother with printer"
[→ Task] [→ Personal] [💼 Delegate] [✕ Dismiss]
```
**Remediation:** Fetch unprocessed captures (`getUnprocessedCaptures()`) and display them inline in the Plan page — NOT as a separate Inbox visit. The inbox page can still exist as a standalone, but the Plan must include a capture triage section. The `inbox-client.tsx` already has this UI; extract it into a reusable `CaptureTriage` component and embed it in the Plan editor.

**Component Spec from PHASE1-UX-SPEC.md Section 13:**
```
Plan Components:
- TodayReview
- AIRecommendation
- TaskCommitment
- CaptureTriage
```
All four components should be created and composed inside `plan-editor.tsx`.

---

### GAP-02: AI Recommendation is a Stub

**Spec Reference:** PHASE1-UX-SPEC.md Section 11.4, SPRINTS-SPEC.md Section 7.3

**Current State:** `recommendations.ts` lines 23-24:
```typescript
// TODO: Implement full scoring algorithm based on tasks deadlines and focus sessions
// For now, return the most recently updated active project.
```
It just returns `projects[0]` (most recently updated). No scoring.

**File:** `src/lib/actions/recommendations.ts`

**Remediation:** Implement the scoring algorithm from the spec:

```
Base Score (PHASE1-UX-SPEC):
  daysUntilDeadline * 40%
  + overdueTaskCount * 20%
  + daysSinceLastSession * 20%
  + blockedTaskCount * 10%
  + urgentComms * 10%

Updated Score (SPRINTS-SPEC — if sprint exists):
  daysUntilDeadline * 30%
  + sprintProgressVsTime * 25%
  + overdueTaskCount * 15%
  + daysSinceLastSession * 15%
  + blockedTaskCount * 10%
  + urgentComms * 5%
```

For each active project:
1. Query `tasks` for overdue count (due_date < today, status != Done)
2. Query `focus_sessions` for days since last session
3. Query `tasks` for blocked count
4. Query project deadline (from lifecycle or project record)
5. If sprint exists, calculate sprint progress ratio vs time elapsed ratio
6. Score and rank. Return the highest.

The reason string should be specific: "Nokhbat deadline in 5 days, 3 overdue tasks" — not generic "Recently active project."

---

### GAP-03: Focus Sessions Don't Auto-Start/End

**Spec Reference:** PHASE1-UX-SPEC.md Section 5.2

**Current State:** `focus-controller.tsx` requires manual "Start Session" button click. When the user navigates away, the session stays "active" with no end time.

**Spec says:**
```
Load /focus/[projectId]:
1. Validate project exists
2. Create/reuse focus_session record  ← AUTO on page load
3. Fetch project, lifecycle, last session, tasks, client, deployment
4. Display full context
```

```
Exit Focus mode:
1. Modal: "Leave session notes (optional)?"
2. Click Save: call endFocusSession(sessionId, notes)
3. Navigate back to /cockpit
```

**Files:** `src/app/(authenticated)/focus/[projectId]/focus-controller.tsx`

**Remediation:**
- **Auto-start**: On component mount (useEffect), call `createFocusSession(projectId)` automatically. Remove the manual "Start Session" button. The focus session IS the fact of being on this page.
- **Auto-end**: Use a `beforeunload` event listener AND intercept Next.js route changes. When the user navigates away, show a modal asking for optional session notes, then call `endFocusSession()`. If they close the browser without the modal, the session stays open (acceptable — can be cleaned up by a cron or on next visit: "You left a session open yesterday. Close it?").
- **Reuse active session**: If an active session already exists for this project (no `ended_at`), reuse it instead of creating a new one. The `getActiveFocusSession()` action already exists for this.

---

## P1 — High Priority Gaps

### GAP-04: Task Committed Date Never Used in UI

**Spec Reference:** PHASE1-UX-SPEC.md Section 1.2 Success Criteria ("Task commitment to dates works"), TASK-VIEW-SPEC.md Section 4.2 (Today's Queue = committed tasks)

**Current State:** The `committed_date` column exists in the DB. Zero UI references it. The Flow Board's Zone 2 (Today's Queue) shows "In Progress" tasks instead of committed tasks.

**Files:**
- `src/app/(authenticated)/plan/plan-editor.tsx` (Task Commitment section — see GAP-01)
- `src/components/features/focus/TodayQueueZone.tsx` (should filter by committed_date)
- `src/components/features/focus/FlowBoard.tsx` (task grouping logic)

**Remediation:**
1. In Plan mode (GAP-01), let users commit tasks → sets `committed_date = tomorrow`
2. In Flow Board Zone 2 (TodayQueueZone), filter tasks where `committed_date = today` instead of just `status = 'In Progress'`
3. Committed tasks should be visually distinct (spec: "they carry a 'you promised yourself' weight")
4. This is what connects the evening Plan ritual to the next day's Focus mode — it's the bridge

---

### GAP-05: Sprint Carry-Forward Decision is Not Interactive

**Spec Reference:** SPRINTS-SPEC.md Section 3 (③ Sprint Review), Section 4.4

**Current State:** `SprintReview.tsx` shows incomplete tasks and says they "will remain in the backlog for the next sprint planning session." No interactive selection.

**Spec says:**
```
② Carry Forward Decision — For each incomplete task:
  keep in next sprint, move to backlog, or drop.
```

**File:** `src/components/features/sprints/SprintReview.tsx`

**Remediation:** For each incomplete task, show three actions:
- **[Next Sprint]** — keeps `sprint_id` (or assigns to new sprint when created)
- **[Backlog]** — clears `sprint_id`, task returns to project backlog
- **[Drop]** — either deletes or archives (confirm with user)

The `completeSprint()` server action already accepts `carryForwardTaskIds` and `backlogTaskIds` parameters. The UI just needs to collect these selections before calling it.

Also missing from Sprint Review: **"Start Sprint N+1?"** auto-prompt. After completing review, offer to immediately start the next sprint with AI-suggested goal based on remaining backlog.

---

### GAP-06: Task Skip Feature Missing (Only Block Exists)

**Spec Reference:** TASK-VIEW-SPEC.md Section 4.1 (Zone 1 buttons), Section 6 (Skipping a Task)

**Current State:** Zone 1 has Done and Block buttons. No Skip (⏭ Next) button.

**Spec says three buttons:**
```
[✓ Done]  [⏭ Next]  [⛔ Block]
```

**Skip behavior:**
```
1. Click [⏭ Next] on current task
2. Task card slides RIGHT back into Queue (stays in position)
3. "Skipped" badge appears briefly
4. Next task in Queue slides UP into Zone 1
5. Skip count tracked — sprint review surfaces frequent skips
```

**Files:**
- `src/components/features/focus/CurrentTaskZone.tsx`
- `src/lib/actions/flow-board.ts` (needs skip action)

**Remediation:**
1. Add a Skip button between Done and Block in `CurrentTaskZone.tsx`
2. On skip: call `unsetCurrentTask()`, increment `skip_count` on the task, then auto-advance to next task via `getNextTask()`
3. The `skip_count` column needs to be added if not present (check the tasks table — spec says `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS skip_count INTEGER DEFAULT 0`)
4. Sprint Review should surface tasks with high skip counts as insights

---

### GAP-07: Board View Mode is Placeholder

**Spec Reference:** TASK-VIEW-SPEC.md Section 7.2

**Current State:** `FlowBoard.tsx` has a toggle between "flow" and "board" modes. Board mode shows "Coming Soon" placeholder text.

**File:** `src/components/features/focus/FlowBoard.tsx`

**Remediation:** Implement the Sprint Board view as described in spec Section 7.2:
- Three columns: TODO | IN PROGRESS | DONE
- Sprint tasks organized by status
- Blocked tasks pulled out separately below
- Collapsible Backlog section at bottom
- This is the kanban-style view for sprint planning and review

This is used for:
- Sprint planning (dragging tasks from backlog to sprint)
- Sprint review (seeing full Done column)
- Weekly reflection (full picture)

---

## P2 — Medium Priority Gaps

### GAP-08: Context Bar Moon Icon Not Time-Aware

**Spec Reference:** PHASE1-UX-SPEC.md Section 9, Section 16

**Current State:** `context-bar.tsx` shows the Moon (🌙) icon whenever the mode is `plan`. The spec intends this as a time-aware nudge.

**Spec says:**
```
At 6 PM → Evening Plan nudges them to review today
```
```
// Date Utilities
export function isAfter6PM(): boolean;
```

**File:** `src/components/layout/context-bar.tsx`

**Remediation:**
- In **Cockpit mode**: Show the Plan link with moon icon only after 6 PM (or user's configured time). Before 6 PM, the Plan link is still accessible but without the moon icon emphasis.
- In **Plan mode**: Moon icon always shows (you're already there).
- Add `isAfter6PM()` utility to `src/lib/utils.ts` or a date utilities file.

This is a subtle but intentional design choice — the moon creates a "time to wind down" signal, not a permanent decoration.

---

### GAP-09: Zone 2 (Today's Queue) Doesn't Match Spec Visual

**Spec Reference:** TASK-VIEW-SPEC.md Section 4.2

**Current State:** `TodayQueueZone.tsx` shows a vertical list of "In Progress" tasks with play buttons.

**Spec describes:**
```
A horizontal track showing today's committed tasks as cards
flowing left to right. Done stacks on the left, upcoming on the right.

┌─DONE──────┐ ┌─DONE──────┐ ┌─NEXT──────┐ ┌────────────┐
│ ✅ Redis  │ │ ✅ JWT    │ │ □ Refresh │ │ □ Session  │
│ setup     │ │ signing   │ │ rotation  │ │ invalidate │
└───────────┘ └───────────┘ └───────────┘ └────────────┘
◄─── completed ─────────── upcoming ────►
```

**Key spec behaviors missing:**
1. Should be HORIZONTAL cards (conveyor belt), not vertical list
2. Should show COMMITTED tasks (`committed_date = today`), not just "In Progress"
3. Done cards should be visible (grayed but present), not hidden
4. Current card should have 🔥 indicator
5. At-risk amber tint after 3 PM for uncommitted tasks
6. "Below the track": sprint tasks not committed today shown as compact text

**File:** `src/components/features/focus/TodayQueueZone.tsx`

**Remediation:** Redesign as horizontal scrollable track. Use `flex-row overflow-x-auto` instead of vertical stack. Filter by `committed_date = today`. Show completed tasks on the left (grayed), upcoming on right. Mark current task with fire icon.

---

### GAP-10: No Capture Triage Integration in Plan

**Spec Reference:** PHASE1-UX-SPEC.md Section 6.1

**Current State:** Capture triage exists only on the standalone `/inbox` page. The Evening Plan page has no reference to captures.

**Remediation:** (Covered in GAP-01, Section 4). Extract `CaptureTriage` component from `inbox-client.tsx` and embed in Plan editor. The inbox page continues to exist for ad-hoc triage, but the evening ritual must include this step.

---

### GAP-11: Sprint Scope Protection Not Enforced in UI

**Spec Reference:** SPRINTS-SPEC.md Section 8

**Current State:** `flow-board.ts` tracks scope changes when moving tasks to sprint mid-sprint (lines 147-153), but new tasks created during an active sprint don't explicitly go to backlog.

**Spec says:**
```
Create new task in Focus mode → Goes to BACKLOG, NOT sprint
Quick Capture → convert to task → Goes to BACKLOG, NOT sprint
Manually add task to sprint → Allowed, logged as scope change
```

**Files:**
- `src/lib/actions/tasks.ts` — `createTask()` should NOT auto-assign sprint_id
- `src/components/features/focus/FlowBoard.tsx` — new task button should clarify "Add to Backlog"
- `src/components/features/focus/SprintBacklogZone.tsx` — "Add to Sprint" should log scope change

**Remediation:** In `createTask()`, ensure `sprint_id` is null by default even when there's an active sprint. The UI should label the add button as "Add to Backlog" during an active sprint. If user explicitly moves to sprint, increment `scope_changes` on the sprint record (this part works already).

---

### GAP-12: Done Ribbon Missing Sprint/Commitment Progress Bars

**Spec Reference:** TASK-VIEW-SPEC.md Section 5

**Current State:** `DoneRibbon.tsx` shows task count and points. Missing the dual progress bars.

**Spec says:**
```
✅ TODAY: 7 tasks · 23 points · 4h 12m focus
sprint: 5/12 ████████░░░░  committed: 3/5 ██████░░░░
```

**File:** `src/components/features/focus/DoneRibbon.tsx`

**Remediation:** Add two progress bars:
1. **Sprint progress**: completed sprint tasks / total sprint tasks
2. **Committed progress**: completed committed tasks today / total committed tasks today
Also add focus time from active session (calculated from session start time).

---

## P3 — Low Priority / "Build Later" Gaps

### GAP-13: Timeline View Not Implemented

**Spec Reference:** TASK-VIEW-SPEC.md Section 7.3

**Current State:** No Timeline view. Toggle only has Flow and Board.

This is listed as "build later" in the spec (item 9 in implementation priority), so it's acceptable to defer. Add it to the view toggle when ready.

---

### GAP-14: AI Next-Task Suggestion Scoring

**Spec Reference:** TASK-VIEW-SPEC.md Section 9.1

**Current State:** `flow-board-next.ts` has a `getNextTask()` function. Need to verify it matches the spec scoring.

**Spec scoring:**
```
Committed today but not started: 40%
Sprint priority × urgency: 25%
Unblocks other tasks: 15%
Last touched longest ago: 10%
Estimated effort fits remaining time: 10%
```

**Remediation:** Verify `getNextTask()` implements these weights. If it's a simple priority sort, update to match the weighted scoring.

---

### GAP-15: Commitment Warning (3 PM Nudge)

**Spec Reference:** TASK-VIEW-SPEC.md Section 9.2

**Current State:** Not implemented.

**Spec says:** At 3 PM (configurable), show inline banner in Zone 2 if committed tasks are untouched.

This is listed as "build later" (item 10). Acceptable to defer but note it exists.

---

### GAP-16: End-of-Day Summary Modal

**Spec Reference:** TASK-VIEW-SPEC.md Section 9.3

**Current State:** Not implemented.

**Spec says:** When leaving Focus mode after 5 PM, show session summary with focus time, tasks completed, sprint progress change, and commitment fulfillment rate.

This is listed as "build later" (item 11). Acceptable to defer.

---

### GAP-17: Task Time Tracking Per Task

**Spec Reference:** TASK-VIEW-SPEC.md Section 11.1

**Current State:** `CurrentTaskZone.tsx` has a timer that counts up, but it's display-only (resets on navigation). The `time_spent_minutes` column and `logTime()` action exist but need verification that time is actually persisted.

**File:** `src/components/features/focus/CurrentTaskZone.tsx`, `src/lib/actions/flow-board.ts`

**Remediation:** When a task stops being current (done, skipped, blocked, or user picks different task), persist the elapsed time to `tasks.time_spent_minutes` using `logTime()`. The timer in Zone 1 should restore from the stored value when returning to a previously started task.

---

### GAP-18: Task Completion Animation

**Spec Reference:** TASK-VIEW-SPEC.md Section 6

**Current State:** Tasks complete but no animation sequence.

**Spec says:**
```
1. Click [✓ Done]
2. Brief celebration: task card shrinks and slides LEFT into Done pile
3. Counter in Done Ribbon increments with a pulse
4. Sprint progress bar advances
5. 300ms pause
6. Next task from Queue slides UP into Zone 1
7. If queue empty: AI suggestion appears
Total: ~800ms
```

This is polish — can be deferred but would significantly improve the "one more" feeling the spec describes.

---

## Implementation Order (Recommended)

Prioritize by dependency chain and spec importance:

### Sprint 1 — Fix the Evening Plan (GAP-01 + GAP-02 + GAP-04)
1. Implement AI recommendation scoring algorithm (GAP-02)
2. Create `TodayReview` component
3. Create `AIRecommendation` component
4. Create `TaskCommitment` component (most important — uses `committed_date`)
5. Extract and create `CaptureTriage` component
6. Compose all 4 into `plan-editor.tsx`
7. Verify `committed_date` flows to Flow Board Zone 2

### Sprint 2 — Fix Focus Session Lifecycle (GAP-03 + GAP-06)
1. Auto-start focus session on page mount
2. Auto-end with modal on navigation away
3. Reuse active session logic
4. Add Skip button to Zone 1
5. Implement skip_count tracking

### Sprint 3 — Sprint Completion & Scope (GAP-05 + GAP-11)
1. Interactive carry-forward UI in Sprint Review
2. "Start next sprint?" auto-prompt
3. Enforce backlog-default for new tasks during active sprint
4. Verify scope_changes counter works

### Sprint 4 — Visual Polish (GAP-08 + GAP-09 + GAP-12 + GAP-07)
1. Time-aware moon icon
2. Horizontal Zone 2 redesign
3. Done Ribbon progress bars
4. Board view implementation

---

## What's Working Well (No Changes Needed)

These features match the specs and are properly implemented:

- **Cockpit page**: Project cards with lifecycle timeline, financial snapshot, personal tasks queue
- **Flow Board Zone 1**: Current task hero card with subtasks, timer, done/block buttons
- **Flow Board Zone 3**: Sprint and Backlog columns with task cards
- **Sprint Planning**: Goal, duration, task selection all work
- **Sprint metrics display**: Velocity, points, completion percentage
- **Quick Capture**: Cmd+K globally, modal opens, capture saved
- **Inbox page**: Capture triage with convert-to-task flow
- **Subtask system**: JSONB storage, inline checkboxes, add/toggle actions
- **Context Bar**: Mode-aware top bar (cockpit/focus/plan variants)
- **App Shell**: No sidebar, context bar navigation works
- **Server actions**: All CRUD operations for focus sessions, daily plans, captures, sprints, tasks
- **Database schema**: All tables created, RLS policies in place, indexes present

---

## Summary

| Severity | Count | Impact |
|----------|-------|--------|
| P0 Critical | 3 | Evening Plan gutted, AI rec is stub, focus sessions don't auto-manage |
| P1 High | 4 | committed_date unused, no carry-forward, no skip, board view placeholder |
| P2 Medium | 5 | Moon icon, Zone 2 layout, captures in plan, scope protection, ribbon bars |
| P3 Low | 6 | Timeline view, animations, time tracking persistence, warnings |

**Total: 18 gaps identified. 7 are critical/high and should be addressed before the app is usable as designed.**

The system's core data layer is solid. The main gap is in the **Evening Plan** page, which is supposed to be the emotional anchor of the entire LifeOS ritual but currently has almost none of its specified functionality. Fixing GAP-01 (Plan) + GAP-02 (AI Rec) + GAP-04 (committed_date) would bring the most value because they connect the planning ritual to the execution workflow — which is the entire point of the Cockpit → Focus → Plan cycle.
