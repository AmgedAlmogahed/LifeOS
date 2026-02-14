# LifeOS UX Overhaul — Claude Code Implementation Spec

## Context

LifeOS is a personal "second brain" app (Next.js 16 + Supabase + shadcn/ui + Tailwind + @dnd-kit). The Cockpit/Focus/Plan ritual core works, but the task management layer has critical usability gaps: you can't click a task to see its details, there's no cross-project view, no calendar, drag-and-drop is scaffolded but not wired, and opening a project auto-starts a focus session even if you just want to browse.

This spec covers 7 phases in dependency order. Each phase can be verified independently.

---

## Phase 1: DB Migration — Project Target Date

**Why:** Projects have no deadline field. Calendar and timeline views need this.

**New file:** `supabase/migrations/20260213_project_target_date.sql`

```sql
ALTER TABLE projects ADD COLUMN target_date DATE;
```

**Update types** in `src/types/supabase.ts` — add `target_date: string | null` to the projects Row, Insert, and Update interfaces.

**Update** `src/lib/actions/projects.ts` — in `updateProject()`, add `target_date` to the fields it reads from FormData:
```typescript
const target_date = formData.get("target_date") as string | null;
if (target_date) updates.target_date = target_date;
```

---

## Phase 2: Task Detail Sheet

**Why:** There is NO way to click a task and see/edit its details anywhere in the app. This is the foundation — every other view will open this sheet when you click a task.

### 2.1 Create TaskDetailSheet Component

**New file:** `src/components/features/tasks/TaskDetailSheet.tsx`

Uses the Sheet component from `src/components/ui/sheet.tsx` (already installed, uses Radix Dialog underneath). Side = "right".

**Props:**
```typescript
interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName?: string;
}
```

**Override SheetContent width** to `sm:max-w-md` (default is `sm:max-w-sm`, too narrow for task details).

**Sheet content sections (top to bottom):**

1. **SheetHeader** — Task title as editable input (save on blur via `updateTask`). Status badge + Priority badge (selectable dropdowns to change).

2. **Meta row** — Project name (read-only), Sprint name if assigned, Story points (editable number input).

3. **Due date** — HTML date input. Below it, show relative text using `formatDistanceToNow` from date-fns. Red if overdue (`isPast`), muted otherwise.

4. **Description** — Textarea. Store in `metadata.description` (tasks.metadata is JSONB, already exists). Save on blur via `updateTask(task.id, { metadata: { ...task.metadata, description: value } })`.

5. **Subtasks** — Checkbox list + "Add subtask" input at bottom. Uses existing `toggleSubtask()` and `addSubtask()` from `src/lib/actions/flow-board.ts`. Show progress: "3 of 5 complete" with small progress bar.

6. **Delegation section** — If `delegated_to` is set: show status badge (pending/in_progress/completed) and `delegation_notes`. If not set: show "Delegate to OpenClaw" ghost button that calls `updateTask(id, { delegated_to: "openclaw", delegation_status: "pending" })`.

7. **Time tracking** — Display `time_spent_minutes` formatted as "Xh Ym". Read-only.

8. **SheetFooter** — Action buttons:
   - Complete (green) → `updateTaskStatus(id, "Done")`
   - Block (amber) → small inline input for reason, then `updateTaskStatus(id, "Blocked")`
   - Skip (gray) → `skipTask(id)` from flow-board.ts
   - Delete (red ghost, small) → confirm dialog, then `deleteTask(id)` from tasks.ts

**After any mutation:** Call `router.refresh()` to trigger Server Component re-fetch (the existing server actions already call `revalidatePath`).

### 2.2 Integrate into FlowBoard

**File:** `src/components/features/focus/FlowBoard.tsx`

Add state:
```typescript
const [selectedTask, setSelectedTask] = useState<Task | null>(null);
const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);

const handleTaskClick = (task: Task) => {
  setSelectedTask(task);
  setIsTaskSheetOpen(true);
};
```

Render TaskDetailSheet after the end-session Dialog, before closing fragment:
```tsx
<TaskDetailSheet
  task={selectedTask}
  open={isTaskSheetOpen}
  onOpenChange={(open) => { setIsTaskSheetOpen(open); if (!open) setSelectedTask(null); }}
/>
```

Pass `onTaskClick={handleTaskClick}` as a new prop to ALL zone components:
- `CurrentTaskZone` — clicking the task title
- `TodayQueueZone` — clicking a task card
- `SprintBacklogZone` — clicking a task title
- `BoardView` — clicking a task card

Each zone component adds an optional prop: `onTaskClick?: (task: Task) => void` and calls it on task title/card click.

### 2.3 Integrate into Forge Detail

**File:** `src/app/(authenticated)/forge/[id]/forge-detail.tsx`

Same pattern: add selectedTask + isTaskSheetOpen state, render TaskDetailSheet at bottom, make the existing task rows in the right sidebar clickable (they currently expand inline — clicking should now open the sheet instead).

---

## Phase 3: Navigation Fix — Separate Browse from Focus

**Why:** Cockpit project cards go to `/focus/[id]` which auto-creates a session. User wants to browse tasks without "starting work."

### 3.1 Change Cockpit Links

**File:** `src/app/(authenticated)/cockpit/page.tsx`

**Line 58** — AI Recommendation link:
```
OLD: href={`/focus/${recommendation.recommendedProject.id}`}
NEW: href={`/forge/${recommendation.recommendedProject.id}`}
```
Change button text: "Enter Focus Mode" → "View Project"

**Line 81** — Active Projects grid:
```
OLD: href={`/focus/${project.id}`}
NEW: href={`/forge/${project.id}`}
```

### 3.2 Add "Enter Focus" Button to Forge Detail

**File:** `src/app/(authenticated)/forge/[id]/forge-detail.tsx`

Add a prominent button in the page header area (next to the project title or in the top-right actions area):

```tsx
<Link
  href={`/focus/${project.id}`}
  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
>
  <Play className="w-4 h-4" /> Enter Focus
</Link>
```

Import: `Play` from lucide-react, `Link` from next/link.

This is now the deliberate entry point to Focus Mode. Browsing happens at `/forge/[id]` — no session created.

---

## Phase 4: Wire Drag and Drop

**Why:** @dnd-kit is installed and DndContext exists in FlowBoard with working handleDragEnd logic, but zones don't have useDroppable hooks and task cards don't have useDraggable hooks. DnD looks broken.

### 4.1 Create DroppableZone Wrapper

Add to FlowBoard.tsx (or extract to shared file):

```tsx
import { useDroppable } from "@dnd-kit/core";

function DroppableZone({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(className, "transition-all duration-200", isOver && "ring-2 ring-primary/50 bg-primary/5 rounded-lg")}
    >
      {children}
    </div>
  );
}
```

### 4.2 Wrap Zones in FlowBoard

Replace the plain `<div>` wrappers around each zone with `<DroppableZone>`:
- CurrentTaskZone wrapper → `<DroppableZone id="current-zone">`
- TodayQueueZone wrapper → `<DroppableZone id="queue-zone">`
- SprintBacklogZone (sprint tasks) wrapper → `<DroppableZone id="sprint-backlog-zone">`
- SprintBacklogZone (project backlog) wrapper → `<DroppableZone id="project-backlog-zone">`

### 4.3 Create DraggableTaskCard Wrapper

**New file:** `src/components/features/focus/DraggableTaskCard.tsx`

```tsx
"use client";
import { useDraggable } from "@dnd-kit/core";
import { Task } from "@/types/database";
import { cn } from "@/lib/utils";

interface DraggableTaskCardProps {
  task: Task;
  children: React.ReactNode;
  className?: string;
}

export function DraggableTaskCard({ task, children, className }: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(className, "cursor-grab active:cursor-grabbing", isDragging && "opacity-40")}
    >
      {children}
    </div>
  );
}
```

### 4.4 Wrap Task Cards in Zone Components

**TodayQueueZone.tsx:** Wrap each task card div with `<DraggableTaskCard task={task}>`. Keep existing card content inside.

**SprintBacklogZone.tsx:** Wrap each task row with `<DraggableTaskCard task={task}>`.

**Note:** Click handlers (for opening TaskDetailSheet) and drag handlers coexist because dnd-kit uses `activationConstraint: { distance: 8 }` — a normal click (< 8px movement) won't trigger drag.

### 4.5 No Changes to handleDragEnd

The existing `handleDragEnd` in FlowBoard.tsx already handles all four zone transitions correctly. It just wasn't receiving events because hooks were missing. No logic changes needed.

---

## Phase 5: Unified Task View

**Why:** User's #1 pain — "there isn't a unified area to see all tasks from every project." Everything is siloed per project. The `/tasks` route currently just redirects to `/forge`.

### 5.1 Replace /tasks Page

**File:** `src/app/(authenticated)/tasks/page.tsx`

Replace entire file (currently just `redirect("/forge")`) with a server component:

```tsx
import { createClient } from "@/lib/supabase/server";
import { TasksClient } from "./tasks-client";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [tasksRes, projectsRes, sprintsRes] = await Promise.all([
    supabase.from("tasks").select("*")
      .eq("user_id", user!.id)
      .neq("status", "Cancelled")
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("projects").select("id, name, status, category, target_date"),
    supabase.from("sprints").select("id, project_id, sprint_number, goal, status, planned_end_at")
      .eq("status", "active"),
  ]);

  return (
    <TasksClient
      tasks={tasksRes.data ?? []}
      projects={projectsRes.data ?? []}
      activeSprints={sprintsRes.data ?? []}
    />
  );
}
```

### 5.2 Create TasksClient Component

**New file:** `src/app/(authenticated)/tasks/tasks-client.tsx`

**Features:**
- Header: "All Tasks" with total count
- **Filter bar:** Project dropdown (All / each project), Status toggle buttons (Todo / In Progress / Done / Blocked), Priority filter
- **Group by selector:** Project (default) | Priority | Due Date | Status | Flat
- **Task rows:** status icon, title, project name chip, priority badge, due date (relative — red if overdue), story points. Click opens TaskDetailSheet.
- Show "Done" tasks in a collapsible section at the bottom (collapsed by default)

**Date display logic in task rows:**
- No due_date → "no date" in muted text
- Due today → "today" in amber
- Due tomorrow → "tomorrow" in amber
- Due in future → "in X days" in default text
- Overdue → "overdue X days" in red text

**Layout sketch:**
```
┌─────────────────────────────────────────────────┐
│  All Tasks (47)                                  │
├─────────────────────────────────────────────────┤
│  Project: [All ▾]  [Todo] [In Progress] [Blocked]│
│  Group by: [Project ▾]                           │
├─────────────────────────────────────────────────┤
│  ── LifeOS Development (3) ──                    │
│  ○ Redesign Cockpit as hub    HIGH   due in 5d   │
│  ○ Upgrade Cmd+K palette      HIGH   due in 5d   │
│  ○ Add context bar links      HIGH   no date     │
│                                                  │
│  ── Client X Website (5) ──                      │
│  ● Fix mobile nav             MED    overdue 2d  │
│  ...                                             │
│                                                  │
│  ── Personal (no project) (2) ──                 │
│  ○ Gym routine                MED    no date     │
└─────────────────────────────────────────────────┘
```

Tasks with `project_id = null` group under "Personal".

### 5.3 Add /tasks to Context Bar

**File:** `src/components/layout/context-bar.tsx`

Add a link to `/tasks` in cockpit-mode navigation. Use `ListTodo` icon from lucide-react. Place it alongside existing navigation items.

---

## Phase 6: Calendar Page

**Why:** User wants to see conflicting timelines and deadlines across all projects in one unified view.

### 6.1 Create Calendar Server Page

**New file:** `src/app/(authenticated)/calendar/page.tsx`

Fetches:
- All tasks with `due_date` IS NOT NULL (or committed_date IS NOT NULL)
- All projects with target_date
- All sprints (active + recent completed) for timeline bars

### 6.2 Create CalendarClient Component

**New file:** `src/app/(authenticated)/calendar/calendar-client.tsx`

**Build a custom monthly calendar** using date-fns (already installed — `startOfMonth`, `endOfMonth`, `eachDayOfInterval`, `startOfWeek`, `endOfWeek`, `isSameDay`, `isSameMonth`, `isToday`, `isPast`, `format`). Do NOT install a heavy calendar library — use Tailwind CSS grid.

**Layout:**
```
┌───────────────────────────────────────────────────┐
│  Calendar        [◀ Prev]  February 2026  [Next ▶]│
├───────────────────────────────────────────────────┤
│  Sun   Mon   Tue   Wed   Thu   Fri   Sat          │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐       │
│ │   │ │   │ │   │ │   │ │   │ │   │ │ 1 │       │
│ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘       │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐       │
│ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 │ │ 7 │ │ 8 │       │
│ │   │ │2t │ │   │ │1t │ │   │ │3t │ │   │       │
│ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘       │
│  ...                                              │
├───────────────────────────────────────────────────┤
│  Sprint bars:                                     │
│  ████ Sprint 1: Access Layer (Feb 10-17)          │
│       ████ Sprint 2: Agent Visibility (Feb 17-24) │
├───────────────────────────────────────────────────┤
│  Selected: February 7 — 3 tasks due               │
│  ○ Fix mobile nav (Client X)            HIGH      │
│  ○ Deploy staging (Client X)            MED       │
│  ○ Arabic lesson prep (Personal)        LOW       │
└───────────────────────────────────────────────────┘
```

**Features:**
- 7-column CSS grid (`grid-cols-7`) for the month
- Each day cell: day number + small colored chips for tasks due that day (max 2-3 visible, "+N more" overflow)
- Clicking a day → selected date state → shows task list panel below
- Clicking a task from the day panel → opens TaskDetailSheet
- Sprint timeline bars below calendar grid — horizontal colored bars spanning start→end dates
- Project target_date shown as milestone markers (diamond icon)
- Today highlighted with primary ring
- Days with overdue tasks get subtle red background tint
- Prev/Next month buttons update `currentDate` state

### 6.3 Add /calendar to Context Bar

**File:** `src/components/layout/context-bar.tsx`

Add `CalendarDays` icon (lucide-react) linking to `/calendar` in cockpit-mode nav, next to the /tasks link.

---

## Phase 7: Show Due Dates in Focus Mode Views

**Why:** Even with the task detail sheet, due dates should be visible at a glance on every task card without clicking.

### 7.1 CurrentTaskZone

**File:** `src/components/features/focus/CurrentTaskZone.tsx`

After task title display, add:
```tsx
{task.due_date && (
  <span className={cn("text-xs mt-1 flex items-center gap-1",
    isPast(new Date(task.due_date)) ? "text-red-500" : "text-muted-foreground"
  )}>
    <CalendarClock className="w-3 h-3" />
    {isPast(new Date(task.due_date)) ? "Overdue" : "Due"} {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
  </span>
)}
```

Import: `CalendarClock` from lucide-react, `isPast`, `formatDistanceToNow` from date-fns.

### 7.2 TodayQueueZone

**File:** `src/components/features/focus/TodayQueueZone.tsx`

In each task card (both done and pending sections), after story_points, add a small due date line. Same pattern: red if overdue, muted otherwise. Use `text-[10px]` to keep cards compact.

### 7.3 SprintBacklogZone

**File:** `src/components/features/focus/SprintBacklogZone.tsx`

After the priority badge in each task row, add a due date chip if `task.due_date` exists. Format: short date or relative ("3d").

### 7.4 BoardView

**File:** `src/components/features/focus/BoardView.tsx`

In each kanban column's task cards, add due date below the title. Same red/muted pattern.

---

## New Files Summary

| File | Phase | Purpose |
|------|-------|---------|
| `supabase/migrations/20260213_project_target_date.sql` | 1 | Add target_date to projects |
| `src/components/features/tasks/TaskDetailSheet.tsx` | 2 | Reusable task detail side panel |
| `src/components/features/focus/DraggableTaskCard.tsx` | 4 | Reusable draggable wrapper for task cards |
| `src/app/(authenticated)/tasks/tasks-client.tsx` | 5 | Cross-project task list client component |
| `src/app/(authenticated)/calendar/page.tsx` | 6 | Calendar server page |
| `src/app/(authenticated)/calendar/calendar-client.tsx` | 6 | Calendar client component |

## Modified Files Summary

| File | Phases | Changes |
|------|--------|---------|
| `src/types/supabase.ts` | 1 | Add target_date to project types |
| `src/lib/actions/projects.ts` | 1 | Add target_date to updateProject |
| `src/components/features/focus/FlowBoard.tsx` | 2, 4 | TaskDetailSheet state + DroppableZone wrappers |
| `src/components/features/focus/CurrentTaskZone.tsx` | 2, 7 | onTaskClick prop + due date display |
| `src/components/features/focus/TodayQueueZone.tsx` | 2, 4, 7 | onTaskClick + DraggableTaskCard + due dates |
| `src/components/features/focus/SprintBacklogZone.tsx` | 2, 4, 7 | onTaskClick + DraggableTaskCard + due dates |
| `src/components/features/focus/BoardView.tsx` | 2, 7 | onTaskClick + due date display |
| `src/app/(authenticated)/forge/[id]/forge-detail.tsx` | 2, 3 | TaskDetailSheet + "Enter Focus" button |
| `src/app/(authenticated)/cockpit/page.tsx` | 3 | Change /focus links to /forge links |
| `src/app/(authenticated)/tasks/page.tsx` | 5 | Replace redirect with real server component |
| `src/components/layout/context-bar.tsx` | 5, 6 | Add /tasks and /calendar nav links |

## Existing Utilities to Reuse

- `updateTask()` — `src/lib/actions/tasks.ts`
- `updateTaskStatus()`, `skipTask()`, `addSubtask()`, `toggleSubtask()` — `src/lib/actions/flow-board.ts`
- `deleteTask()` — `src/lib/actions/tasks.ts`
- `formatDistanceToNow`, `isPast`, `isSameDay`, `isToday`, `startOfMonth`, `endOfMonth`, `eachDayOfInterval`, `startOfWeek`, `endOfWeek`, `format` — date-fns
- `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetFooter` — `src/components/ui/sheet.tsx`
- `cn()` — `src/lib/utils`
- `toast` from sonner — for action feedback
- `useDroppable`, `useDraggable` — `@dnd-kit/core`

---

## Verification Checklist

### Phase 1 (Migration):
- [ ] `SELECT target_date FROM projects LIMIT 1;` succeeds
- [ ] App starts without type errors

### Phase 2 (Task Detail Sheet):
- [ ] Click task in FlowBoard → Sheet slides in from right
- [ ] Sheet shows title, status, priority, due date, subtasks, time
- [ ] Can edit title (saves on blur)
- [ ] Can set/change due date
- [ ] Add/toggle subtasks works
- [ ] Complete/Block/Skip/Delete buttons work
- [ ] Sheet closes on X, Escape, or overlay click
- [ ] Flow view remains visible behind sheet overlay
- [ ] Same works from Forge detail page

### Phase 3 (Navigation):
- [ ] Cockpit project cards navigate to `/forge/[id]`
- [ ] AI Recommendation navigates to `/forge/[id]`
- [ ] Forge detail has "Enter Focus" button
- [ ] Clicking "Enter Focus" → `/focus/[id]` → session created
- [ ] Browsing at `/forge/[id]` creates NO session

### Phase 4 (DnD):
- [ ] Task cards show grab cursor on hover
- [ ] Dragging 8+ pixels shows DragOverlay preview
- [ ] Drop zones highlight with ring + tint when hovered
- [ ] Drop on current-zone → In Progress
- [ ] Drop on queue-zone → sprint + In Progress
- [ ] Drop on sprint-backlog → sprint + Todo
- [ ] Drop on project-backlog → removed from sprint
- [ ] Click (< 8px) still opens task sheet (no conflict)

### Phase 5 (Unified Tasks):
- [ ] `/tasks` shows all tasks across all projects
- [ ] Filter by project works
- [ ] Filter by status works
- [ ] Group by project/priority/status works
- [ ] Due dates display with correct relative text
- [ ] Overdue tasks show in red
- [ ] Click task opens detail sheet
- [ ] Unassigned tasks show under "Personal"

### Phase 6 (Calendar):
- [ ] `/calendar` renders monthly grid
- [ ] Days with tasks show colored chips
- [ ] Click day shows task list below
- [ ] Click task from day list opens detail sheet
- [ ] Prev/Next month navigation works
- [ ] Today highlighted
- [ ] Sprint bars visible below grid

### Phase 7 (Due Dates in Focus):
- [ ] Current task shows due date below title
- [ ] Queue cards show due dates
- [ ] Backlog rows show due dates
- [ ] Board view cards show due dates
- [ ] Overdue = red, upcoming = muted
