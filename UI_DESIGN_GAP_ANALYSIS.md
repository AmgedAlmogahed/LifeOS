# UI_DESIGN_GAP_ANALYSIS.md
## LifeOS — UI/UX Structural Audit & Logic Alignment

> **Auditor Role:** Senior UI/UX Engineer & Frontend Auditor
> **Date:** 2026-02-25
> **Scope:** `/src/app/(authenticated)` + `/src/components`
> **Reference Specs:** `ARCHITECTURE.md` v0.2.0 · Relational Engineering Model

---

## Audit Area 1 — Navigation Model Integrity

### Files Inspected
- `src/components/layout/app-shell.tsx` (the single root shell)
- `src/components/layout/context-bar.tsx`
- `src/components/layout/sidebar.tsx`
- `src/app/(authenticated)/layout.tsx`

### Findings

#### Layout Chain
```
(authenticated)/layout.tsx
  └── <AppShell inboxCount={n}> (app-shell.tsx)
        ├── <ContextBar mode={mode} .../>    ← Correct (mode-aware)
        ├── <Sidebar open={isSidebarOpen} /> ← Legacy (ACTIVE)
        └── <main>{children}</main>
```

**`AppShell`** renders **both** the `ContextBar` and the `Sidebar` simultaneously on every authenticated page. The sidebar is never conditionally removed for Focus or Plan modes — it is omnipresent behind the hamburger button.

#### Mode Detection — ContextBar
The mode is derived from `pathname` (`/focus/*` → `'focus'`, `/plan/*` → `'plan'`, everything else → `'cockpit'`). This part is correct and aligns with the spec.

#### Sidebar Scope
The legacy `Sidebar` exposes 20+ feature-list links grouped under Workflow, Projects, Business, and System:

| Group | Links |
|---|---|
| Workflow | Portal, Cockpit, All Tasks, Calendar, Daily Plan, Inbox |
| Projects | Forge, Projects, Modules, Deployments |
| Business | Pipeline, Clients, Finance, Communications, Meetings |
| System | Audit Logs, Guardian Rules, Leverage, Vault, Terminal, Settings |

This is a direct contradiction of `ARCHITECTURE.md §9.2`: *"No Sidebar — The app uses a contextual top bar."*

### Severity Matrix

| Issue | Severity | Impact |
|---|---|---|
| Legacy Sidebar is actively rendered in `AppShell` on ALL pages including Focus mode | 🔴 **Critical** | Breaks core "No sidebar" principle; clutters Focus UX; contradicts the IA's mode model |
| Sidebar hamburger toggle exists inside ContextBar instead of being removed | 🟡 **High** | ContextBar renders a hamburger-menu button whose sole purpose is to reveal a nav that shouldn't exist |
| All 20+ cross-cutting links permanently accessible via sidebar | 🟡 **High** | Encourages feature-centric navigation over the project-centric model |
| Mode detection logic for ContextBar is correct | ✅ **Pass** | — |

**Fix:** Remove `<Sidebar>` from `AppShell`. Move secondary views (Finance, Clients, etc.) to be accessible via Cockpit dashboard links and Command Palette only.

---

## Audit Area 2 — Project Canvas Structure (The 3-Column Test)

### Files Inspected
- `src/app/(authenticated)/projects/[id]/project-forge.tsx`
- `src/app/(authenticated)/projects/[id]/page.tsx`

### Current Layout Architecture

The `ProjectForge` component renders a **2-column layout**:

```
┌───────────────────────────────┬────────────────────────┐
│  LEFT COLUMN (flex-1)         │  RIGHT COLUMN (420px)  │
│  Tab content:                 │  Implementation:       │
│  - Docs (specs + assets)      │  - SprintControl       │
│  - Milestones                 │  - Progress bar        │
│  - Budget (invoices table)    │  - Task list (flat)    │
│  (no Minutes tab in nav, tab  │                        │
│   state exists but no button) │                        │
└───────────────────────────────┴────────────────────────┘
```

**Required (per Relational Engineering Model):**

```
┌─────────────────┬──────────────────┬──────────────────────────┐
│ SCOPE TREE      │ EXECUTION        │ CONTEXT DRAWER           │
│ (Hierarchical   │ (Active tasks,   │ (Assets tab,             │
│  WBS tree)      │  sprint board,   │  Finance/Ghost Invoices, │
│                 │  Gantt)          │  OpenClaw / Authority)   │
└─────────────────┴──────────────────┴──────────────────────────┘
```

### Gap Analysis

| Spec Requirement | Current Implementation | Status |
|---|---|---|
| **Column 1 — Recursive Scope Tree** | Absent. No left-side panel exists with a hierarchical tree. The `project_phases → project_modules → tasks` schema exists in DB but no component renders it as a tree/outline. | 🔴 **Missing** |
| **Left column is hierarchical** (recursive nodes, expand/collapse) | The task list in the right panel is a flat `tasks.map()` with accordion expand — no nesting, no hierarchy. | 🔴 **Flat, Not Hierarchical** |
| **Column 3 — Context Drawer** dedicated right panel | Current right panel at `w-[420px]` is the "Implementation" panel, showing sprint and tasks. It is NOT a Context Drawer with independent tabs. | 🟡 **Wrong Purpose** |
| **Context Drawer: Assets tab** | Assets are in the LEFT column under "Docs" tab, co-mingled with spec text. | 🟡 **Misplaced** |
| **Context Drawer: Finance / Ghost Invoices tab** | A "Budget" tab shows a raw invoice table. No "Ghost Invoice" concept (placeholder milestone-linked invoices) is visualized. | 🟡 **Partial / Wrong Model** |
| **Context Drawer: OpenClaw tab** | No dedicated OpenClaw/Agent tab in any project panel. Delegation happens only at the Task Drawer level. | 🔴 **Missing** |
| **Phase Pipeline display** | ✅ Present — horizontal phase indicator (`Understand → Document → Freeze → Implement → Verify`) renders correctly below the project header. | ✅ **Pass** |

### Severity Matrix

| Issue | Severity |
|---|---|
| No 3rd column / Context Drawer — current layout is 2-column | 🔴 Critical |
| Scope Tree (Column 1) completely absent; no recursive WBS component | 🔴 Critical |
| Task list is flat — no hierarchy, no phase/module grouping | 🔴 Critical |
| Assets and Specs are co-mingled in one "Docs" tab | 🟡 High |
| Ghost Invoice concept (milestone-linked placeholders) not visualized | 🔴 Critical |
| No OpenClaw/Agent context panel at project level | 🟡 High |

---

## Audit Area 3 — Task Management & Contextual Linking

### Files Inspected
- `src/components/features/tasks/TaskDetailSheet.tsx` (448 lines)

### Finding: Contract Reference Chip

**Status: ❌ ABSENT**

A search across all task-related files reveals **zero instances** of:
- Contract reference fields
- PDF page number inputs
- Document anchor `chip` components
- Any `contract_ref`, `doc_page`, or equivalent prop

The `TaskDetailSheet` fields are: Title · Status · Priority · Due Date · Description · Subtasks · Delegation · Time Spent. No document or contract linking UI exists at any level.

**Schema gap:** The `tasks` table has no `contract_id` FK and no `doc_page_ref` column. This feature cannot be built without both a schema migration and a new UI component.

### Finding: Authority Tracking Status Indicator

**Status: ❌ ABSENT**

A full-text search across `/src` for `authority`, `permit`, `authority_application`, or `tracking.*id` yields **zero component matches**. The term "authority" appears only in CSS class variant type matches (unrelated). There is no:
- Authority status badge on tasks
- External task type indicator
- Permit tracking ID field
- Days-waiting counter

### Finding: Blocker Note Persistence

**Status: 🟡 PARTIAL — Captured but NOT Persisted**

The `TaskDetailSheet` has a `blockReason` local state variable and a text input. However, the `handleBlock()` function is:

```typescript
const handleBlock = () => {
  if (!blockReason.trim()) return;
  startTransition(async () => {
    await updateTask(task.id, { status: "Blocked" }); // ← reason is DROPPED
    router.refresh();
    toast.info("Task blocked");
    setShowBlockInput(false);
    setBlockReason(""); // ← reason is cleared without saving
  });
};
```

The `blockReason` string is never passed to `updateTask()`. There is also no `block_reason` column in the `tasks` schema to receive it. The UI **collects** the reason but **discards** it immediately.

### Severity Matrix

| Issue | Severity | Fix Required |
|---|---|---|
| Contract Reference Chip — no UI, no schema column | 🔴 Critical | Schema migration (`tasks.contract_id` FK + `doc_page_ref`) + new chip component |
| Authority status indicator on tasks — completely absent | 🔴 Critical | New `task_type = 'authority'` enum value + badge display |
| Blocker reason not persisted to DB | 🟡 High | Add `block_reason TEXT` column to `tasks`, pass value in `handleBlock()` |

---

## Audit Area 4 — Engineering Visualizations (The Missing Tabs)

### Files Inspected
- `src/app/(authenticated)/projects/[id]/project-forge.tsx` (tab navigation)
- `src/app/(authenticated)/forge/[id]/forge-detail.tsx` (tab navigation)
- `src/components/features/focus/FlowBoard.tsx` (line 3)
- `package.json` (dependency manifest)

### Finding: Gantt Tab

**Status: ❌ ZERO IMPLEMENTATION**

| Check | Result |
|---|---|
| Gantt library in `package.json` | ❌ Not found. Current dependencies: `@dnd-kit/*`, `framer-motion`, `date-fns`, `lucide-react`, `radix-ui`, `sonner`. No Gantt library. |
| Gantt component file in `/src` | ❌ None found. |
| Gantt tab in `project-forge.tsx` | ❌ Tab list is: `"docs" \| "minutes" \| "milestones" \| "budget"`. No Gantt. |
| Gantt tab in `forge-detail.tsx` | ❌ Tab list has ONE entry: `"overview"`. Only one tab button exists. |
| Known TODO | ⚠️ `FlowBoard.tsx` line 3: `// TODO: GAP-13 (P3) — Timeline view mode (Gantt-style sprint timeline)` — self-documented gap. |

**Required Gantt data model gaps:**
- `tasks` has `due_date` but no `start_date` — impossible to render bars without both endpoints
- No per-task duration or dependency relationship columns

### Finding: Authority Tab

**Status: ❌ COMPLETELY ABSENT**

No tab, no route segment, no component for:
- Government permit status tracking
- Tracking ID field
- Days-waiting counter
- Approval workflow visualization
- Filing date / submission status

This is not a "stub" — there is literally no file, no line of code, and no database table that relates to the Authority Tracking domain anywhere in the frontend.

### Severity Matrix

| Issue | Severity | Effort |
|---|---|---|
| No Gantt chart library installed | 🔴 Critical | S (install) |
| No Gantt component exists anywhere in codebase | 🔴 Critical | XL (build from scratch) |
| `tasks` table missing `start_date` field | 🔴 Critical | S (migration) |
| No "Gantt" tab in either project detail view | 🔴 Critical | S (add tab + wire component) |
| Authority tab — complete absence | 🔴 Critical | XL (new module) |

---

## Audit Area 5 — Lifecycle & State Management

### Files Inspected
- `src/app/(authenticated)/cockpit/page.tsx` (project cards)
- `src/app/(authenticated)/focus/[projectId]/focus-controller.tsx`
- `src/app/(authenticated)/projects/[id]/project-forge.tsx` (phase pipeline)

### Finding: Project Lifecycle UI

**Current Phase Model:**
```
Understand → Document → Freeze → Implement → Verify
```

**Required Lifecycle per Relational Engineering IA:**
```
Lead → Proposal → Planning → Building → Deploy → Delivery
```

These are **two completely different domain vocabularies**. The current enum (`project_status`) reflects an internal engineering workflow (spec → freeze → implement). The required IA uses a **client-facing project delivery lifecycle** (Lead → Proposal → Planning → Building → Deploy → Delivery).

| Check | Result |
|---|---|
| Phase pipeline renders visually in `project-forge.tsx` | ✅ Yes — horizontal stepper with color-coded states |
| Phase pipeline matches required lifecycle vocabulary | ❌ Wrong vocabulary — 5 internal phases vs. 6 client-delivery phases |
| `project_status` enum in `schema.sql` | `'Understand', 'Document', 'Freeze', 'Implement', 'Verify'` — does not match |
| Visual treatment (current/past/future) | ✅ CSS classes applied correctly per current phase index |

**Verdict:** The pipeline component architecture is sound but is enslaved to the wrong domain model. A full enum migration and UI label update are required.

### Finding: Resume State Snippet

**Status: ❌ NOT DISPLAYED ON COCKPIT**

The spec (ARCHITECTURE.md §2.1, §4.1) defines that project cards on the Cockpit must show:

> *"last session: 'Completed signup flow, left off at login endpoint'"*

**Current Cockpit Card rendering** (`cockpit/page.tsx`):
```tsx
<h3>{project.name}</h3>
<p>{project.description}</p>   // ← static description, NOT last session
<span>Progress: {project.progress}%</span>
<span>{formatDistanceToNow(project.updated_at)} ago</span>
```

- `focus_sessions` IS fetched: `select("*, focus_sessions(started_at, ended_at)")` — but `session_notes` is NOT included in the SQL select
- The fetched session data is **never rendered** — no UI element surfaces the last session's notes
- `session_notes` are saved to DB (`endFocusSession(session.id, sessionNotes)`) but never retrieved for display

**Finding: Inside Focus Mode**

The `FocusController` renders the "Active Session" panel with start time. It does NOT display the **previous session's notes** as a "resume state" context snippet. When entering focus cold (no active session), the user is shown an empty "Ready to Focus?" prompt with no historical context.

### Severity Matrix

| Issue | Severity | Fix Required |
|---|---|---|
| Project lifecycle enum vocabulary mismatch (5 wrong phases vs. 6 required phases) | 🔴 Critical | Enum ALTER + data migration + UI label update |
| Resume State snippet not displayed on Cockpit project cards | 🔴 Critical | Add `session_notes` to SQL select; render last session note as context chip on card |
| Resume State not displayed on entering Focus mode | 🟡 High | Query last completed `focus_session.session_notes` for project; render as "Last session:" banner |
| Session notes are saved but never surfaced anywhere in the UI | 🟡 High | Wasted data — notes exist in DB but are invisible to user |

---

## Master Severity Matrix

| # | Audit Area | Finding | Severity | Effort |
|---|---|---|---|---|
| 1 | Navigation | Legacy Sidebar active on ALL pages including Focus | 🔴 Critical | S |
| 2 | Navigation | Hamburger in ContextBar toggles a nav that shouldn't exist | 🟡 High | S |
| 3 | Project Canvas | Missing Column 1 — Scope Tree (hierarchical WBS) | 🔴 Critical | XL |
| 4 | Project Canvas | Missing Column 3 — Context Drawer (Assets / Finance / OpenClaw tabs) | 🔴 Critical | L |
| 5 | Project Canvas | Task list is flat (no phase/module grouping) | 🔴 Critical | M |
| 6 | Project Canvas | Ghost Invoice visualization absent | 🔴 Critical | L |
| 7 | Project Canvas | No OpenClaw project-level panel | 🟡 High | M |
| 8 | Task Drawer | Contract Reference Chip — no UI, no schema | 🔴 Critical | M |
| 9 | Task Drawer | Authority status indicator on tasks — absent | 🔴 Critical | M |
| 10 | Task Drawer | Blocker reason not persisted to DB | 🟡 High | S |
| 11 | Visualizations | No Gantt library, no component, no `start_date` on tasks | 🔴 Critical | XL |
| 12 | Visualizations | Authority tab — zero implementation, zero schema | 🔴 Critical | XL |
| 13 | Lifecycle | Phase enum wrong vocabulary domain | 🔴 Critical | M |
| 14 | Lifecycle | Resume State not shown on Cockpit project cards | 🔴 Critical | S |
| 15 | Lifecycle | Resume State not shown on entering Focus mode | 🟡 High | S |
| 16 | Lifecycle | `session_notes` fetched but never rendered anywhere | 🟡 High | S |

**Effort scale:** S < 1 day · M = 1–3 days · L = 3–7 days · XL = 1+ week

---

## Recommended Sprint Priorities

### Sprint 0 — Navigation Cleanup (1 day)
1. Remove `<Sidebar>` from `AppShell`
2. Remove hamburger button from `ContextBar`
3. Persist blocker reason to `tasks.block_reason` (schema + action fix)
4. Surface `session_notes` on Cockpit cards and Focus entry view

### Sprint 1 — Project Canvas Restructure (2 weeks)
1. Redesign `/projects/[id]` to 3-column layout
2. Build recursive Scope Tree component (phases → modules → tasks with expand/collapse)
3. Build Context Drawer with tabs: Assets · Finance · OpenClaw
4. Ghost Invoice visualization in Finance tab

### Sprint 2 — Lifecycle Alignment (1 week)
1. Migrate `project_status` enum to correct vocabulary (Lead → Proposal → Planning → Building → Deploy → Delivery)
2. Update Phase Pipeline UI with new labels and correct logic
3. Add `start_date` to `tasks` schema
4. Add `contract_id` FK and `block_reason` column to `tasks`

### Sprint 3 — Engineering Visualizations (3 weeks)
1. Install and integrate Gantt library (recommend `frappe-gantt` for simplicity)
2. Build Gantt tab in Project Canvas
3. Build Authority Tracking module: schema → `authority_applications` table, route `/authority`, project tab

---

*Report generated by automated file-level analysis. All line numbers and component names cite the exact source files. No assumptions made — every gap deduced from direct code inspection.*
