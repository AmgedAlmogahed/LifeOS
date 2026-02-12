# LifeOS — Task View Design: "The Flow Board"

> **Status:** Design Concept — Needs Review Before Implementation
> **Owner:** Rabwa
> **Date:** February 12, 2026
> **Context:** Replaces flat task list in Focus mode with a psychology-driven visualization

---

## 1. The Psychology Behind the Design

Six principles from behavioral science, each mapped to a specific design decision:

### Principle 1 — Single-Task Focus (Flow State Theory)

**Science:** Mihaly Csikszentmihalyi's research shows flow state requires a clear, singular goal with immediate feedback. Multi-tasking is an illusion — the brain switches, it doesn't parallel process.

**Design rule:** The view must always show ONE task as the current thing. Not three "In Progress" cards. One. Big. Impossible to ignore. Everything else is secondary.

### Principle 2 — Visible Progress Fuels Motivation (The Progress Principle)

**Science:** Teresa Amabile's research at Harvard found that the single most important factor in worker motivation is making progress on meaningful work. Even small wins compound.

**Design rule:** Completed tasks don't disappear. They stack visibly. You SEE the pile growing. A "Done Today" counter is always visible. The sprint progress bar advances in real-time. Finishing a task feels like scoring a point, not clearing a notification.

### Principle 3 — Commitment Creates Follow-Through (Implementation Intentions)

**Science:** Peter Gollwitzer's research shows that "I will do X" statements dramatically increase execution rates — from ~30% to ~70%. Writing it down is even stronger (your bullet journal proof).

**Design rule:** Tasks you committed to last night (in Plan mode) are visually distinct from uncommitted tasks. They carry a "you promised yourself" weight. If it's 4 PM and you haven't touched a committed task, it shows subtle urgency — not a nagging popup, but a visual temperature change.

### Principle 4 — Loss Aversion > Gain Motivation (Kahneman & Tversky)

**Science:** Losing something feels ~2x worse than gaining the equivalent. "You're falling behind on today's commitment" motivates more than "you could get ahead."

**Design rule:** The system shows what's AT RISK, not just what's done. "3 of 5 committed tasks done, 2 at risk" is more powerful than "3 tasks done today!" Both are shown, but the risk signal is more prominent when relevant.

### Principle 5 — Decision Fatigue is Real (Baumeister)

**Science:** Every decision you make drains the same mental resource. Deciding WHAT to work on competes with the energy to DO the work. This is your core pain.

**Design rule:** The system decides for you. After completing a task, the NEXT task is already suggested. You don't scan a board, you don't prioritize on the fly. The AI sorted it. You can override, but the default is "do this one." Zero-decision workflow.

### Principle 6 — The Zeigarnik Effect (Unfinished = Memorable)

**Science:** Bluma Zeigarnik found that people remember unfinished tasks better than finished ones. An incomplete task creates mental tension that demands resolution.

**Design rule:** A task you've started (clicked "Start") but haven't finished carries a visible "in motion" state that's distinct from "Todo." It creates a gentle pull to return and complete it. The current task you walked away from yesterday shows prominently when you re-enter Focus mode.

---

## 2. Why Not Pure Kanban

| Kanban Assumption | Solo Dev Reality | Flow Board Solution |
|---|---|---|
| Multiple people move cards through stages | One person does everything | Remove status columns, use commitment zones instead |
| "In Progress" column has several cards | Solo dev has 1-2 at most | Elevate the ONE active task, don't give it a column |
| Board is a status display | Solo dev needs a decision tool | AI suggests next task, system is opinionated |
| All "Todo" cards look equal | Some are committed, some are sprint, some are backlog | Visual hierarchy by commitment level |
| Done column fills up (team output) | Solo dev's done column grows slowly | "Done Today" counter + growing stack creates the same satisfaction |
| Cards have equal visual weight | A 1-hour task and a 2-day task look identical | Size/points shown, estimated effort visible |

The Flow Board keeps kanban's best quality — **visual spatial organization** — but replaces status columns with **commitment zones** that match how a solo dev's brain actually works.

---

## 3. The Three Zones

The Focus mode task view is organized into three vertical zones. Each zone serves a different psychological need and a different time horizon.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ZONE 1: THE CURRENT                                            │
│  ═══════════════════                                            │
│  One task. Big. Timer running. Subtask progress.                │
│  "This is what you're doing RIGHT NOW."                         │
│  Psychological need: Flow state, clarity, single-focus          │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ZONE 2: TODAY'S QUEUE                                          │
│  ════════════════════                                           │
│  Horizontal track of 3-5 cards. Committed tasks for today.     │
│  Visual: conveyor belt moving left. Done stacks on the left.   │
│  "This is what you promised yourself tonight."                  │
│  Psychological need: Commitment, sequence, no decisions         │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ZONE 3: THE BOARD                                              │
│  ════════════════                                               │
│  Two columns: Sprint | Backlog. Compact. Scrollable.            │
│  Mini kanban for the bigger picture.                            │
│  "This is the full scope. You don't need to think about it."   │
│  Psychological need: Awareness, planning, scope management      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Detailed Wireframes

### 4.1 Zone 1 — The Current Task

This is the hero of the entire view. ONE task, big, focused, with everything you need to work on it.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  🔥 CURRENT TASK                                    ⏱ 47 min    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  Implement JWT + Redis session management                  │  │
│  │                                                            │  │
│  │  Sprint 3 · 5 pts · Critical                              │  │
│  │  Context: "Left off at refresh token logic yesterday"      │  │
│  │                                                            │  │
│  │  Subtasks:                                                 │  │
│  │  ✅ Set up Redis connection                               │  │
│  │  ✅ JWT signing service                                   │  │
│  │  ✅ Access token generation                               │  │
│  │  □  Refresh token rotation          ← you are here        │  │
│  │  □  Session invalidation                                  │  │
│  │                                                            │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                │  │
│  │  │ ✓ Done   │  │ ⏭ Next   │  │ ⛔ Block  │                │  │
│  │  └──────────┘  └──────────┘  └──────────┘                │  │
│  │                                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Behavior:**

- **Timer** runs automatically from the focus session start. Shows how long you've been working on this specific task (not just the session).
- **Context note** shows what you (or AI) noted last time you worked on this task. This is the "zero context-switch cost" principle.
- **Subtasks** are optional but powerful. They show micro-progress within a task. Completing a subtask feels like a mini-win without having to mark the whole task done.
- **[✓ Done]** — Completes the task. Triggers a satisfaction animation (brief, not annoying). The NEXT task from Zone 2 slides up into Zone 1.
- **[⏭ Next]** — Skip this task for now (moves it back to Queue). The next committed task takes its place. Logged — if you skip often, sprint review surfaces it.
- **[⛔ Block]** — Mark as blocked. Prompts for a reason. Task moves to a "Blocked" section in Zone 3. Next task slides up.

**When Zone 1 is empty** (no current task):

```
┌───────────────────────────────────────────────────────────────┐
│                                                                │
│  🎯 WHAT'S NEXT?                                              │
│                                                                │
│  AI suggests: "Build Named Passport Strategies"               │
│  Reason: Sprint 3, Critical priority, unblocks 2 other tasks  │
│                                                                │
│  [▶ Start This]    [↓ Pick from Queue]                        │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

The system NEVER shows an empty state. If you haven't picked a task, AI picks one for you. You confirm or override. Zero decision tax.

### 4.2 Zone 2 — Today's Queue (The Commitment Track)

A horizontal track showing today's committed tasks as cards flowing left to right. Think of it as a conveyor belt — done items accumulate on the left, upcoming items wait on the right.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  📋 TODAY'S COMMITMENT                        3/5 done · 2 left │
│                                                                  │
│  ┌─DONE──────┐ ┌─DONE──────┐ ┌─DONE──────┐ ┌─NEXT──────┐ ┌────────────┐ │
│  │ ✅ Redis  │ │ ✅ JWT    │ │ ✅ Access  │ │ □ Refresh │ │ □ Session  │ │
│  │ setup     │ │ signing   │ │ tokens    │ │ rotation  │ │ invalidate │ │
│  │ 2 pts     │ │ 3 pts     │ │ 2 pts     │ │ 3 pts  🔥 │ │ 2 pts      │ │
│  │ ░░░░░░░░░ │ │ ░░░░░░░░░ │ │ ░░░░░░░░░ │ │ ▓▓▓▓░░░░░ │ │ ░░░░░░░░░░ │ │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └────────────┘ │
│  ◄─── completed ───────────────────────── upcoming ────►                │
│                                                                          │
│  Not committed today but in sprint:                                      │
│  □ Auth error handling [2] · □ CASL permissions [5]                     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Visual language:**

- **Done cards** are muted/grayed but VISIBLE (not hidden). They show progress. The pile grows.
- **Current card** (the one active in Zone 1) has a 🔥 indicator and a colored border.
- **Upcoming cards** are fully visible but not highlighted.
- **At-risk indicator**: If it's past 3 PM and you have 3 uncommitted tasks, the upcoming cards get a subtle warm tint (amber). Not red. Not alarming. Just awareness. Loss aversion, gently applied.
- **Below the track**: Sprint tasks that aren't committed to today are shown as a compact text list. Available if you finish early and want to pull more in.

**Interactions:**

- Click a queue card → it becomes the Current task in Zone 1
- Drag to reorder the queue
- Click [+] → pull a task from sprint or backlog into today's commitment
- Done cards can be clicked to review (see subtasks, notes, time spent)

### 4.3 Zone 3 — The Board (Mini Kanban)

This is where kanban lives — but compressed and secondary. It's the "full picture" zone for planning, not the "working" zone. Two columns only:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  📊 SPRINT & BACKLOG                                            │
│                                                                  │
│  ┌─ 🏃 Sprint 3 (5 remaining) ──────┐  ┌─ 📦 Backlog (12) ───┐│
│  │                                    │  │                      ││
│  │ □ Auth error handling       [2]   │  │ □ CRM module     [5] ││
│  │ ⛔ CASL permissions (blocked)[5]  │  │ □ Sales APIs     [8] ││
│  │ □ Admin dashboard API       [3]   │  │ □ Contracts APIs [5] ││
│  │ □ Role-based routes         [5]   │  │ □ Finance APIs   [5] ││
│  │ □ Login form connection     [3]   │  │ □ Maintenance    [5] ││
│  │                                    │  │ □ Technician     [3] ││
│  │ Sprint progress:                   │  │ □ HR & Payroll   [5] ││
│  │ ████████████░░░░░ 7/12 · 23 pts   │  │ ... 5 more           ││
│  │                                    │  │                      ││
│  │ [+ Add to Sprint]                 │  │ [+ New Task]         ││
│  │                                    │  │ [? AI Breakdown]     ││
│  └────────────────────────────────────┘  └──────────────────────┘│
│                                                                  │
│  ⛔ BLOCKED (2)                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ CASL permissions — "Waiting for identity schema decision"  │  │
│  │ Admin dashboard — "Depends on CASL permissions"            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key differences from traditional kanban:**

1. **Two columns, not four.** "In Progress" doesn't need a column — it's Zone 1. "Done" doesn't need a column — it's the growing pile in Zone 2. Only Sprint and Backlog need columnar display.

2. **Blocked is pulled OUT as its own section** at the bottom. Blocked tasks in a kanban column are invisible landmines. Here they're called out explicitly with the reason visible. This creates urgency to unblock.

3. **This zone is collapsible.** When you're deep in work, you collapse Zone 3 and just see Zone 1 (current task) + Zone 2 (today's queue). Maximum focus. Expand when you need to plan.

4. **Drag interactions:**
   - Backlog → Sprint: Pull task into sprint (scope change logged)
   - Sprint → Queue: Commit task to today
   - Queue → Zone 1: Start working on it

---

## 5. The Done Ribbon

A persistent element that grows throughout the day. Always visible, never in the way.

```
┌─────────────────────────────────────────────────────────────────┐
│ ✅ TODAY: 7 tasks · 23 points · 4h 12m focus                   │
│ ░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░            │
│ sprint: 5/12 ████████░░░░  committed: 3/5 ██████░░░░           │
└─────────────────────────────────────────────────────────────────┘
```

This ribbon is ALWAYS visible at the bottom of the view (or as a sticky footer). It serves pure Progress Principle psychology: you see the number going up all day. The progress bars for sprint and daily commitment give you a sense of how you're tracking.

**Visual treatment:**
- Starts empty in the morning: "✅ TODAY: 0 tasks · Start your day"
- Each completion adds to the counter with a brief pulse animation
- Sprint bar slowly fills over the 2-week cycle
- Committed bar fills within the day — reaching 100% feels like winning

---

## 6. State Transitions & Animations

### Completing a Task (The Win Moment)

```
1. Click [✓ Done] on current task
2. Brief celebration: task card shrinks and slides LEFT into the Done pile
3. Counter in Done Ribbon increments with a pulse
4. Sprint progress bar advances
5. 300ms pause (let the win register)
6. Next task from Queue slides UP into Zone 1
7. If queue is empty: AI suggestion appears
```

This sequence takes ~800ms total. It's not a confetti explosion (annoying after the 5th time) — it's a satisfying, rhythmic transition that creates a "one more" feeling. Like clearing lines in Tetris.

### Starting a Task

```
1. Click task card in Queue (or accept AI suggestion)
2. Card elevates and expands into Zone 1 position
3. Timer starts
4. Context note loads (last session note for this task, if any)
5. Subtasks expand (if defined)
```

### Blocking a Task

```
1. Click [⛔ Block] on current task
2. Prompt: "What's blocking this?" (required, one line)
3. Task card slides DOWN to Blocked section in Zone 3
4. Visual: red left border on the blocked card
5. Next task slides UP into Zone 1
6. If blocked task blocks other tasks, those show a chain icon
```

### Skipping a Task

```
1. Click [⏭ Next] on current task
2. Task card slides RIGHT back into Queue (not to the end — stays in position)
3. "Skipped" badge appears briefly on the card
4. Next task in Queue slides UP into Zone 1
5. Skip count tracked — sprint review surfaces frequent skips
```

---

## 7. View Modes (Togglable)

The default is the Flow Board (zones). But sometimes you need a different lens:

### 7.1 Flow Board (Default)

The three-zone layout described above. Optimized for DOING work.

### 7.2 Sprint Board (Kanban-Inspired)

For sprint planning and review. Traditional columnar view but with only three columns:

```
┌─────────────────────────────────────────────────────────────────┐
│  🏃 SPRINT 3 — "Complete auth + Admin login"                    │
│  Day 8 of 14 · ████████░░░░ 7/12                               │
├──────────────────┬──────────────────┬───────────────────────────┤
│  TODO (5)        │  IN PROGRESS (1) │  DONE (7)                 │
│                  │                  │                            │
│  □ Auth errors   │  🔥 Refresh      │  ✅ Redis setup           │
│  □ CASL perms    │     rotation     │  ✅ JWT signing           │
│  □ Admin API     │                  │  ✅ Access tokens         │
│  □ Role routes   │                  │  ✅ Passport strategies   │
│  □ Login form    │                  │  ✅ Login endpoint        │
│                  │                  │  ✅ Auth middleware        │
│                  │                  │  ✅ Logout endpoint        │
│                  │                  │                            │
│  ⛔ BLOCKED (1)  │                  │                            │
│  Admin dashboard │                  │                            │
│  "Needs CASL"    │                  │                            │
├──────────────────┴──────────────────┴───────────────────────────┤
│  📦 BACKLOG (12 tasks not in sprint)               [Expand ▼]  │
└─────────────────────────────────────────────────────────────────┘
```

Use this view for:
- Sprint planning (dragging tasks from backlog to sprint)
- Sprint review (seeing the full Done column)
- Getting the "full picture" during weekly reflection

### 7.3 Timeline View

For seeing tasks plotted against time. Useful for deadline awareness.

```
┌─────────────────────────────────────────────────────────────────┐
│  📅 SPRINT 3 TIMELINE                                           │
│                                                                  │
│  Feb 3  ·  Feb 7  ·  Feb 10  ·  Feb 14  ·  Feb 17 (end)      │
│  ──●────────●────────●─────────◐───────────○──────             │
│    │        │        │         │           │                     │
│    │        │        │    TODAY │           │                     │
│    │        │        │         │           │                     │
│  Done:6   Done:7   Done:7    Todo:5     Deadline               │
│                                                                  │
│  IDEAL PACE: ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ (0.85 tasks/day) │
│  YOUR PACE:  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬░░░░░░░░░░░ (slightly behind)│
│                                                                  │
│  ⚠️ At current pace, 2 tasks may carry forward to Sprint 4     │
└─────────────────────────────────────────────────────────────────┘
```

This is the burndown chart reimagined for a solo dev. Instead of a chart you need to interpret, it tells you plainly: "You're slightly behind. 2 tasks may carry forward." Data → insight → action.

---

## 8. Toggle Between Views

```
┌─────────────────────────────────────────────┐
│  View:  [● Flow]  [○ Board]  [○ Timeline]  │
└─────────────────────────────────────────────┘
```

Three radio buttons at the top of the task section. Default is Flow (the three-zone view). Board and Timeline are secondary views for planning and reflection.

---

## 9. AI Behaviors Within the Flow Board

### 9.1 Next Task Suggestion

When Zone 1 is empty or you complete a task, AI suggests what to do next based on:

```
Score = weighted factors:
  - Committed today but not started (40%)     ← highest weight: you promised
  - Sprint priority × urgency (25%)
  - Unblocks other tasks (15%)                ← clearing bottlenecks
  - Last touched longest ago (10%)            ← Zeigarnik: finish what you started
  - Estimated effort fits remaining time (10%) ← don't start 5-hour task at 5 PM
```

### 9.2 Commitment Warning

At configurable time (default 3 PM):

```
┌─────────────────────────────────────────────┐
│ ⚠️ 2 committed tasks not started yet.       │
│ At current pace, they may not get done.     │
│ [Focus on them] [Move to tomorrow] [Dismiss]│
└─────────────────────────────────────────────┘
```

Not a popup. A subtle inline banner in Zone 2. Respects your focus but surfaces the loss aversion signal.

### 9.3 End-of-Day Summary

When you leave Focus mode after 5 PM:

```
┌─────────────────────────────────────────────┐
│ 📊 Session Summary                          │
│                                              │
│ Focus time: 5h 23m                          │
│ Tasks completed: 6 (14 points)              │
│ Sprint progress: 58% → 67%                  │
│ Committed: 4/5 done (1 moved to tomorrow)   │
│                                              │
│ 🔥 Streak: 3rd day hitting 80%+ commitment  │
│                                              │
│ [Save & Go to Plan]  [Back to Cockpit]      │
└─────────────────────────────────────────────┘
```

This bridges Focus mode → Plan mode. The data from today feeds directly into tonight's reflection.

---

## 10. Subtasks — The Micro-Progress System

Tasks can optionally have subtasks. Subtasks are lightweight — just text + checkbox. They serve the Progress Principle by creating completable micro-goals within a larger task.

```typescript
// Subtasks are stored as JSONB on the task record
// No separate table — keeps it lightweight
interface Subtask {
  id: string;          // generated UUID
  text: string;        // "Set up Redis connection"
  is_done: boolean;
  completed_at?: string;
}

// Stored in tasks.metadata.subtasks
```

**Behavior:**
- Subtasks show in Zone 1 (Current Task card) with checkboxes
- Each subtask completion triggers a mini progress update (bar fills)
- Subtask progress shows on cards in Zone 2: "3/5" with a tiny bar
- AI can suggest subtask breakdowns: "Break this into steps?"

**When to use subtasks vs separate tasks:**
- **Subtasks**: Steps within one sitting. "Set up Redis" → "Write signing service" → "Test"
- **Separate tasks**: Independent work items that could be done in different sessions.

---

## 11. Database Changes

### 11.1 Task table additions

```sql
-- Subtasks stored as JSONB (lightweight, no separate table)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb;

-- Track which task is "current" in a focus session
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT false;

-- Track skip count for sprint review insights
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS skip_count INTEGER DEFAULT 0;

-- Track time spent on this specific task (minutes)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS time_spent_minutes INTEGER DEFAULT 0;
```

### 11.2 TypeScript additions

```typescript
export interface Subtask {
  id: string;
  text: string;
  is_done: boolean;
  completed_at?: string;
}

// Task interface additions (add to existing):
// subtasks: Subtask[];
// is_current: boolean;
// skip_count: number;
// time_spent_minutes: number;
```

---

## 12. Implementation Priority

### Build now (with Sprint system):

1. Zone 1 — Current Task card (big task + timer + done/next/block buttons)
2. Zone 2 — Today's Queue (horizontal committed tasks track)
3. Zone 3 — Sprint + Backlog columns (basic, no drag-and-drop yet)
4. Done Ribbon (counter + sprint/commitment progress bars)
5. Task completion flow (animation + auto-advance to next task)
6. AI next-task suggestion (when Zone 1 is empty)

### Build later:

7. Subtask system (JSONB + inline checkboxes)
8. Sprint Board view (kanban toggle)
9. Timeline view (burndown-style)
10. Commitment warning (3 PM nudge)
11. End-of-day summary modal
12. Drag-and-drop between zones
13. Task time tracking (per-task timer)
14. Skip tracking + sprint review insights

---

## 13. The Key Innovation — Summary

Traditional task views are **passive displays**. They show you status and let you figure out what to do.

The Flow Board is an **active guide**. It:

- **Decides for you** what to work on next (AI suggestion)
- **Shows you ONE thing** at a time (flow state)
- **Makes commitments visible** (loss aversion + implementation intentions)
- **Celebrates progress** (growing Done pile + counters)
- **Protects your scope** (sprint separation)
- **Surfaces risks early** (commitment warnings, blocked task callouts)
- **Eliminates decisions** (the most expensive part of solo work)

The three zones map to three brain modes:
- **Zone 1 (Current)** = Execution brain. "DO this."
- **Zone 2 (Queue)** = Planning brain. "You committed to THESE."
- **Zone 3 (Board)** = Strategic brain. "Here's the FULL picture."

You spend 90% of your time in Zone 1. Zone 2 is glanceable. Zone 3 is expandable when needed. The cognitive cost of managing tasks approaches zero.

---

*This spec should be reviewed before implementation. The coding agent should implement Zones 1-3 + Done Ribbon as part of the Focus mode build, alongside the Sprint system.*
