# LifeOS — Implementation Gap Analysis (v2 — Verified)

> **Date:** February 12, 2026
> **Last Verified:** February 12, 2026
> **Purpose:** Identify every gap between the approved specs and the current implementation
> **Specs Audited:** PHASE1-UX-SPEC.md, SPRINTS-SPEC.md, TASK-VIEW-SPEC.md
> **Verdict:** ~85% implemented. Major wins on Evening Plan and AI Recommendation. Remaining gaps are in Focus Session lifecycle, Sprint Review UX, and visual polish.

---

## How to Read This Document

Each gap is categorized by severity:

- **P0 — Critical**: Core spec feature completely missing. Breaks the intended workflow.
- **P1 — High**: Feature exists but is a stub or fundamentally incomplete.
- **P2 — Medium**: Feature partially works but missing important spec behaviors.
- **P3 — Low**: Polish, edge case, or "build later" item from spec.
- **RESOLVED**: Previously identified gap that has been fixed.

---

## RESOLVED Gaps (Previously Identified, Now Fixed)

### ~~GAP-01: Evening Plan~~ — RESOLVED

The Plan page now has all 5 sections properly composed:

1. **TodayReview** — `src/components/features/plan/TodayReview.tsx`: 3 stat cards (completed tasks, in-progress, focus time) fetched server-side
2. **Daily Reflection** — Textarea for wins and lessons learned
3. **CaptureTriage** — `src/components/features/plan/CaptureTriage.tsx`: Inline capture processing with dismiss and convert-to-task dialog (project assignment)
4. **AIRecommendation** — `src/components/features/plan/AIRecommendation.tsx`: Shows recommended project with Accept/Edit buttons, saves to `ai_recommendation_text`
5. **TaskCommitment** — `src/components/features/plan/TaskCommitment.tsx`: Per-project task checkboxes, calls `commitTasks()` to set `committed_date`
6. **Closing Thoughts** — Textarea for tomorrow's focus

**Data flow:** `page.tsx` fetches stats, recommendation, captures, and projects with tasks in parallel. All passed to `PlanEditor` which composes the sections.

---

### ~~GAP-02: AI Recommendation~~ — RESOLVED

`src/lib/actions/recommendations.ts` now implements the full scoring algorithm:

- Fetches active projects with contracts, tasks, focus sessions, and sprints in parallel
- Scores each project using weighted factors:
  - **Without sprint**: Deadline 40%, Overdue 20%, Session recency 20%, Blocked 10%
  - **With active sprint**: Deadline 30%, Sprint progress 25%, Overdue 15%, Session 15%, Blocked 10%
- Returns specific reason strings: "Deadline in 5 days, 3 overdue tasks"
- Falls back to most recent project only if all scores are 0

---

### ~~GAP-04: Task Committed Date~~ — RESOLVED

- `commitTasks()` action in `tasks.ts` sets `committed_date` on selected tasks
- `TaskCommitment` component lets users check tasks per project for tomorrow
- `FlowBoard.tsx` filters Zone 2 tasks by `committed_date === today` OR `status === 'In Progress'`
- Already-committed tasks show "ALREADY COMMITTED" badge and are disabled

---

### ~~GAP-10: Capture Triage in Plan~~ — RESOLVED

`CaptureTriage` component is extracted and embedded in the Plan editor (conditionally shown when captures > 0). Includes dismiss and convert-to-task with project assignment dialog.

---

### ~~GAP-17: Task Time Tracking~~ — RESOLVED

`CurrentTaskZone.tsx` logs time every 60 seconds via `logTime(taskId, 1)`. The `logTime()` action in `flow-board.ts` persists to `time_spent_minutes` column. Timer auto-increments while task is current.

---

## P0 — Critical Gaps (Still Open)

### GAP-03: Focus Sessions Don't Auto-Start/End

**Spec Reference:** PHASE1-UX-SPEC.md Section 5.2

**Current State:** `focus-controller.tsx` renders a "Ready to Focus?" prompt with a manual "Start Session" button. When the user navigates away, the session stays "active" with no end time. No `beforeunload` listener exists anywhere in the codebase.

**Spec says:**
```
Load /focus/[projectId]:
1. Validate project exists
2. Create/reuse focus_session record  ← AUTO on page load
3. Fetch project, lifecycle, last session, tasks, client, deployment
4. Display full context

Exit Focus mode:
1. Modal: "Leave session notes (optional)?"
2. Click Save: call endFocusSession(sessionId, notes)
3. Navigate back to /cockpit
```

**File:** `src/app/(authenticated)/focus/[projectId]/focus-controller.tsx`

**Remediation:**
- **Auto-start**: On component mount (`useEffect`), check for an existing active session via `getActiveFocusSession(projectId)`. If none exists, call `createFocusSession(projectId)` automatically. Remove the "Ready to Focus?" prompt — entering the Focus page IS starting a session.
- **Auto-end**: Intercept Next.js route changes (use `next/navigation`'s `useRouter` events or a custom navigation guard). When the user tries to leave, show a modal asking for optional session notes, then call `endFocusSession()`. Also add a `beforeunload` event for browser close/refresh.
- **Reuse active session**: If an active session already exists (no `ended_at`), reuse it. Show "Session resumed — started X minutes ago."
- **Stale session cleanup**: On Focus page load, if a stale session exists from a different day, auto-close it with no notes: "Closed stale session from yesterday."

---

## P1 — High Priority Gaps (Still Open)

### GAP-05: Sprint Carry-Forward Decision is Not Interactive

**Spec Reference:** SPRINTS-SPEC.md Section 3 (③ Sprint Review), Section 4.4

**Current State:** `SprintReview.tsx` lines 82-100 show incomplete tasks in a read-only list with a tooltip: "These items will remain in the backlog for the next sprint planning session." There is a comment in the code acknowledging the spec gap. The `handleComplete()` function calls `completeSprint()` without any per-task decisions.

**Spec says:**
```
③ Sprint Review:
2. Carry Forward Decision — For each incomplete task:
   keep in next sprint, move to backlog, or drop.
```

**File:** `src/components/features/sprints/SprintReview.tsx`

**Remediation:** For each incomplete task, add a selector or button group with three options:
- **[Next Sprint]** — task stays associated, will be pre-selected when next sprint is planned
- **[Backlog]** — clears `sprint_id`, task returns to general project backlog
- **[Drop]** — marks task as cancelled/dropped (confirm with user)

Default selection should be "Next Sprint" for most tasks. Collect the selections into two arrays (`carryForwardTaskIds` and `backlogTaskIds`), then pass them to `completeSprint()`.

Also add: **"Start Sprint N+1?"** auto-prompt after completing the review, with the carried-forward tasks pre-checked.

---

### GAP-06: Task Skip Feature Missing (Only Block Exists)

**Spec Reference:** TASK-VIEW-SPEC.md Section 4.1, Section 6

**Current State:** `CurrentTaskZone.tsx` has three buttons: Block (with dialog), a MoreHorizontal menu (calls `unsetCurrentTask()` to put back in queue), and Complete. There is no explicit Skip button with the spec's behavior (increment skip_count, auto-advance to next task).

**Spec says three buttons:**
```
[✓ Done]  [⏭ Next]  [⛔ Block]
```

**Skip behavior (spec):**
```
1. Click [⏭ Next]
2. Task moves back into Queue (stays in position)
3. "Skipped" badge appears briefly
4. Next task slides UP into Zone 1
5. Skip count tracked — sprint review surfaces frequent skips
```

**Files:**
- `src/components/features/focus/CurrentTaskZone.tsx`
- `src/lib/actions/flow-board.ts`

**Remediation:**
1. Replace the MoreHorizontal menu with an explicit Skip button (⏭ icon, "Skip" label)
2. On skip: call `unsetCurrentTask()`, then increment `skip_count` on the task record, then call `getNextTask()` to auto-advance to the next task
3. Verify `skip_count` column exists in the tasks table (TASK-VIEW-SPEC specifies `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS skip_count INTEGER DEFAULT 0`)
4. In Sprint Review, surface tasks with high skip counts as an insight: "These tasks were frequently skipped — consider removing or breaking them down"

---

### GAP-07: Board View Mode is Placeholder

**Spec Reference:** TASK-VIEW-SPEC.md Section 7.2

**Current State:** `FlowBoard.tsx` renders a toggle between "flow" and "board" modes. Board mode shows: "Board View Coming Soon (Use Flow View for now)".

**File:** `src/components/features/focus/FlowBoard.tsx`

**Remediation:** Implement the Sprint Board view from spec Section 7.2:

```
┌──────────────────┬──────────────────┬───────────────────────────┐
│  TODO (5)        │  IN PROGRESS (1) │  DONE (7)                 │
│  □ Auth errors   │  🔥 Refresh      │  ✅ Redis setup           │
│  □ CASL perms    │     rotation     │  ✅ JWT signing           │
│  ...             │                  │  ...                       │
├──────────────────┴──────────────────┴───────────────────────────┤
│  ⛔ BLOCKED (1): Admin dashboard — "Needs CASL"                │
├─────────────────────────────────────────────────────────────────┤
│  📦 BACKLOG (12 tasks not in sprint)                 [Expand ▼] │
└─────────────────────────────────────────────────────────────────┘
```

Three columns (TODO/IN PROGRESS/DONE) for sprint tasks. Blocked tasks called out below. Collapsible backlog at bottom. Used for sprint planning and review.

---

## P2 — Medium Priority Gaps (Still Open)

### GAP-08: Context Bar Moon Icon Not Time-Aware

**Spec Reference:** PHASE1-UX-SPEC.md Section 9, Section 16

**Current State:** `context-bar.tsx` line 59: Moon icon appears whenever `mode === 'cockpit'` as part of the Plan link. No time-based logic — no `new Date().getHours()` check anywhere.

**Spec intends:** Moon icon serves as a "time to wind down" signal after 6 PM.

**File:** `src/components/layout/context-bar.tsx`

**Remediation:**
- In Cockpit mode: Show Plan link always, but add moon icon + visual emphasis (glow, pulse) only after 6 PM
- Before 6 PM: Plan link shows without moon icon — still accessible, just not emphasized
- Add utility: `function isEveningTime(): boolean { return new Date().getHours() >= 18; }`
- The moon icon in Plan mode header (line 49) can stay always-on since you're already in the ritual

---

### GAP-09: Zone 2 (Today's Queue) is Vertical Instead of Horizontal

**Spec Reference:** TASK-VIEW-SPEC.md Section 4.2

**Current State:** `TodayQueueZone.tsx` renders tasks as a vertical stack (`space-y-2`). Filtering is correct (committed_date === today OR status === In Progress, excluding current and done).

**Spec describes a horizontal conveyor belt:**
```
┌─DONE──────┐ ┌─DONE──────┐ ┌─NEXT──────┐ ┌────────────┐
│ ✅ Redis  │ │ ✅ JWT    │ │ □ Refresh │ │ □ Session  │
└───────────┘ └───────────┘ └───────────┘ └────────────┘
◄─── completed ─────────── upcoming ────►
```

**File:** `src/components/features/focus/TodayQueueZone.tsx`

**Remediation:**
1. Change layout from `space-y-2` to `flex flex-row gap-3 overflow-x-auto` for horizontal scrolling
2. Each card becomes a compact fixed-width card (~160px) with title, points, and status
3. Done cards show on the LEFT (grayed but visible) — growing pile creates Progress Principle satisfaction
4. Current card (in Zone 1) shows 🔥 indicator in the queue position
5. After 3 PM: uncommitted tasks get subtle amber tint (loss aversion nudge)
6. Below the track: compact text list of sprint tasks not committed today

---

### GAP-11: Sprint Scope Protection — Tracking Only, No UI Enforcement

**Spec Reference:** SPRINTS-SPEC.md Section 8

**Current State:** `flow-board.ts` increments `scope_changes` when moving tasks to sprint mid-sprint. But `createTask()` in `tasks.ts` has no logic to prevent auto-assigning to sprint. UI doesn't label "Add to Backlog" during active sprints.

**Spec says:**
```
Create new task in Focus mode → Goes to BACKLOG, NOT sprint
Quick Capture → convert to task → Goes to BACKLOG, NOT sprint
Manually add task to sprint → Allowed, logged as scope change
```

Note: The spec intentionally chose "log scope changes instead of blocking them" — so enforcement is about UI defaults, not hard blocks.

**Remediation:**
1. In Focus mode task creation, ensure `sprint_id` is null by default (verify `createTask()` doesn't auto-assign)
2. Label the add task button as "Add to Backlog" during active sprints
3. If user moves task to sprint, show a brief notice: "Task added to sprint (+1 scope change)"
4. Scope changes counter already works — this is mostly a UI labeling issue

---

### GAP-12: Done Ribbon Missing Dual Progress Bars

**Spec Reference:** TASK-VIEW-SPEC.md Section 5

**Current State:** `DoneRibbon.tsx` shows task count, story points, and a single "Daily Goal" progress bar.

**Spec says:**
```
✅ TODAY: 7 tasks · 23 points · 4h 12m focus
sprint: 5/12 ████████░░░░  committed: 3/5 ██████░░░░
```

**File:** `src/components/features/focus/DoneRibbon.tsx`

**Remediation:** Add two progress bars:
1. **Sprint progress**: completed sprint tasks / total sprint tasks (pass sprint data as props)
2. **Committed progress**: completed committed tasks today / total committed tasks today
3. Add focus time display (calculated from active session start time)

---

## P3 — Low Priority / "Build Later" Gaps (Still Open)

### GAP-13: Timeline View Not Implemented

**Spec Reference:** TASK-VIEW-SPEC.md Section 7.3

Listed as "build later" (spec item 9). Add burndown-style timeline to view toggle when ready.

---

### GAP-14: AI Next-Task Suggestion Scoring

**Spec Reference:** TASK-VIEW-SPEC.md Section 9.1

`flow-board-next.ts` has `getNextTask()`. Verify it matches the spec's weighted scoring (committed today 40%, sprint priority 25%, unblocks others 15%, last touched 10%, effort fits remaining time 10%).

---

### GAP-15: Commitment Warning (3 PM Nudge)

**Spec Reference:** TASK-VIEW-SPEC.md Section 9.2

Not implemented. Listed as "build later" (spec item 10). Show inline banner in Zone 2 at 3 PM if committed tasks are untouched.

---

### GAP-16: End-of-Day Summary Modal

**Spec Reference:** TASK-VIEW-SPEC.md Section 9.3

Not implemented. Listed as "build later" (spec item 11). Show session summary when leaving Focus after 5 PM.

---

### GAP-18: Task Completion Animation

**Spec Reference:** TASK-VIEW-SPEC.md Section 6

No animation sequence on task completion. Spec describes an ~800ms flow: card shrinks → slides left → counter pulses → next task slides up. Pure polish but important for the "one more" dopamine loop.

---

## Implementation Order (Recommended)

### Sprint 1 — Focus Session Lifecycle (GAP-03)
This is the only P0 remaining and blocks the "entering Focus IS working" philosophy.
1. Auto-start session on Focus page mount (useEffect + createFocusSession)
2. Reuse existing active session if present
3. Auto-end with notes modal on navigation away
4. Stale session cleanup on next visit

### Sprint 2 — Sprint Review + Skip (GAP-05 + GAP-06)
Complete the sprint cycle and the Zone 1 interaction model.
1. Interactive carry-forward UI per task in Sprint Review
2. "Start next sprint?" auto-prompt after review
3. Add Skip button to Zone 1 (⏭) with skip_count tracking
4. Auto-advance to next task after skip

### Sprint 3 — Visual & UX Polish (GAP-08 + GAP-09 + GAP-12 + GAP-07)
Bring the UI closer to the spec's design language.
1. Time-aware moon icon in context bar
2. Horizontal Zone 2 redesign (conveyor belt)
3. Done Ribbon dual progress bars (sprint + committed)
4. Board view implementation (3-column kanban)

### Sprint 4 — Scope Protection + Deferred Items (GAP-11 + P3s)
1. UI labeling for "Add to Backlog" during active sprints
2. AI next-task scoring verification (GAP-14)
3. Timeline view (GAP-13) if time allows
4. Commitment warning / end-of-day summary (GAP-15, GAP-16)

---

## What's Working Well (No Changes Needed)

These features match the specs and are properly implemented:

- **Evening Plan (5-section ritual)**: TodayReview → Reflection → CaptureTriage → AIRecommendation → TaskCommitment → Closing Thoughts
- **AI Recommendation Engine**: Full weighted scoring with sprint awareness
- **Task Commitment Flow**: committed_date set via Plan, flows to Focus Board Zone 2
- **Cockpit page**: Project cards with lifecycle timeline, financial snapshot, personal tasks
- **Flow Board Zone 1**: Current task hero card with subtasks, timer (persists every 60s), done/block buttons
- **Flow Board Zone 3**: Sprint and Backlog columns with task cards
- **Sprint Planning**: Goal, duration, task selection, commitment display
- **Sprint metrics**: Velocity, points, completion percentage, scope changes counter
- **Quick Capture**: Cmd+K globally, modal opens/closes, capture saved and triaged
- **Inbox page**: Standalone capture triage with convert-to-task flow
- **Subtask system**: JSONB storage, inline checkboxes, add/toggle actions
- **Context Bar**: Mode-aware top bar (cockpit/focus/plan variants)
- **App Shell**: No sidebar, context bar navigation, Cmd+K listener
- **Server actions**: Full CRUD for focus sessions, daily plans, captures, sprints, tasks, commits
- **Database schema**: All tables, RLS policies, indexes, migrations in place
- **Scope tracking**: scope_changes counter increments on mid-sprint task additions

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| RESOLVED | 5 | Evening Plan, AI Rec, committed_date, Capture Triage in Plan, Time Tracking |
| P0 Critical | 1 | Focus session auto-start/end |
| P1 High | 3 | Sprint carry-forward, skip button, board view |
| P2 Medium | 4 | Moon icon, Zone 2 horizontal, scope protection UI, ribbon dual bars |
| P3 Low | 4 | Timeline, next-task scoring, 3 PM warning, end-of-day summary, animations |

**Total: 12 remaining gaps. 1 critical, 3 high. The Evening Plan and AI systems are fully functional.**

The most impactful single fix is **GAP-03 (Focus session auto-start/end)** because it's the only remaining P0 and it defines the philosophy of Focus mode: entering the page IS working. Everything else is high-value but the system is usable without it.
