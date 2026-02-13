# LifeOS — Implementation Prompt for Claude Code

## Context

LifeOS is a personal operating system for a solo entrepreneur. It uses **Next.js 16.1.6** (App Router, Server Components, `"use server"` actions), **Supabase** (PostgreSQL + Auth + RLS), **Shadcn UI**, **Tailwind CSS**, and **Lucide icons**.

Sprint 1 (Focus Session auto-start/end) is already done. You need to implement **Sprints 2, 3, and 4** below. After each sprint, run `npm run build` to verify.

---

## SPRINT 2 — Sprint Carry-Forward + Skip Button (P1)

### 2.1 Update `completeSprint()` in `src/lib/actions/sprints.ts`

**Current signature:** `completeSprint(sprintId: string, projectId: string)`

**New signature:**
```ts
completeSprint(
  sprintId: string,
  projectId: string,
  taskDecisions?: { carryForward: string[]; backlog: string[]; drop: string[] }
)
```

**Logic to add BEFORE the existing metrics calculation:**
```ts
if (taskDecisions) {
    const supabase = await createClient();

    // Carry-forward: keep sprint_id (they'll be pre-selected for next sprint planning)
    // No change needed — they stay assigned to the old sprint but are still "not Done"
    // Actually, we need to NULL their sprint_id so they can be picked up by next sprint
    // Carry-forward means: set sprint_id = null but mark them somehow for next sprint
    // Simplest: just leave them in the sprint. When next sprint is created, SprintReview
    // for the NEW sprint will show "carried from previous"
    // OR: we null sprint_id and set a flag. Let's go simple: null sprint_id for all non-Done.

    // Backlog: set sprint_id = null
    if (taskDecisions.backlog.length > 0) {
        await supabase.from("tasks")
            .update({ sprint_id: null, added_to_sprint_at: null })
            .in("id", taskDecisions.backlog);
    }

    // Drop: set status = 'Cancelled'
    if (taskDecisions.drop.length > 0) {
        await supabase.from("tasks")
            .update({ status: "Cancelled" })
            .in("id", taskDecisions.drop);
    }

    // Carry-forward: set sprint_id = null (ready for next sprint planning)
    if (taskDecisions.carryForward.length > 0) {
        await supabase.from("tasks")
            .update({ sprint_id: null, added_to_sprint_at: null })
            .in("id", taskDecisions.carryForward);
    }
}
```

Keep the existing metrics calculation code that comes after this block.

### 2.2 Interactive carry-forward UI in `src/components/features/sprints/SprintReview.tsx`

Replace the current static incomplete task list (the `{incompleteTasks.length > 0 && (...)}` block, lines 82-100) with an interactive per-task decision UI.

**Current state:** Shows a read-only list of incomplete tasks with text "These items will remain in the backlog."

**New behavior:**
- Each incomplete task gets 3 radio-style buttons: **Next Sprint** (default selected) | **Backlog** | **Drop**
- Track selections in state: `const [taskDecisions, setTaskDecisions] = useState<Record<string, 'carry' | 'backlog' | 'drop'>>({})` — initialize all incomplete tasks to `'carry'`
- On "Confirm & Close Sprint", collect the IDs into three arrays and pass to `completeSprint(sprint.id, sprint.project_id, { carryForward, backlog, drop })`

Here is the replacement JSX for the incomplete tasks section:

```tsx
{incompleteTasks.length > 0 && (
    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-orange-600 flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4" />
            {incompleteTasks.length} Incomplete Tasks — What should happen?
        </h4>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {incompleteTasks.map(t => (
                <div key={t.id} className="flex items-center justify-between gap-3 bg-background/50 p-2.5 rounded">
                    <span className="text-sm truncate flex-1">{t.title}</span>
                    <div className="flex gap-1 shrink-0">
                        <Button
                            size="sm"
                            variant={taskDecisions[t.id] === 'carry' ? 'default' : 'outline'}
                            className="h-7 px-2 text-[11px]"
                            onClick={() => setTaskDecisions(prev => ({ ...prev, [t.id]: 'carry' }))}
                        >
                            Next Sprint
                        </Button>
                        <Button
                            size="sm"
                            variant={taskDecisions[t.id] === 'backlog' ? 'secondary' : 'outline'}
                            className="h-7 px-2 text-[11px]"
                            onClick={() => setTaskDecisions(prev => ({ ...prev, [t.id]: 'backlog' }))}
                        >
                            Backlog
                        </Button>
                        <Button
                            size="sm"
                            variant={taskDecisions[t.id] === 'drop' ? 'destructive' : 'outline'}
                            className="h-7 px-2 text-[11px]"
                            onClick={() => setTaskDecisions(prev => ({ ...prev, [t.id]: 'drop' }))}
                        >
                            Drop
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    </div>
)}
```

Also update the state initialization. Add this after the existing state declarations:

```tsx
const [taskDecisions, setTaskDecisions] = useState<Record<string, 'carry' | 'backlog' | 'drop'>>(() => {
    const initial: Record<string, 'carry' | 'backlog' | 'drop'> = {};
    tasks.filter(t => t.status !== "Done").forEach(t => { initial[t.id] = 'carry'; });
    return initial;
});
```

And update `handleComplete`:

```tsx
const handleComplete = () => {
    startTransition(async () => {
        const carryForward = Object.entries(taskDecisions).filter(([, v]) => v === 'carry').map(([id]) => id);
        const backlog = Object.entries(taskDecisions).filter(([, v]) => v === 'backlog').map(([id]) => id);
        const drop = Object.entries(taskDecisions).filter(([, v]) => v === 'drop').map(([id]) => id);

        await completeSprint(sprint.id, sprint.project_id, { carryForward, backlog, drop });
        onOpenChange(false);
    });
};
```

Remove the unused `step` state and the `moveTaskToSprint` import if no longer used.

### 2.3 Add `skipTask()` to `src/lib/actions/flow-board.ts`

Add this new function at the end of the file:

```ts
export async function skipTask(taskId: string) {
    const supabase = await createClient();

    // Read current skip_count
    const { data: task } = await supabase.from("tasks").select("skip_count, project_id").eq("id", taskId).single();
    if (!task) return { error: "Task not found" };

    const newCount = (task.skip_count || 0) + 1;

    const { error } = await supabase
        .from("tasks")
        .update({ skip_count: newCount, is_current: false })
        .eq("id", taskId);

    if (error) return { error: error.message };

    if (task.project_id) revalidatePath(`/focus/${task.project_id}`);
    return { success: true };
}
```

### 2.4 Add Skip button to `src/components/features/focus/CurrentTaskZone.tsx`

Replace the MoreHorizontal button (line 154-156 — the one with `unsetCurrentTask(projectId)`) with a proper Skip button:

**Old code:**
```tsx
<Button size="sm" variant="outline" className="h-9 w-9 p-0 rounded-full" onClick={() => unsetCurrentTask(projectId)} title="Put back to Queue">
    <MoreHorizontal className="w-4 h-4" />
</Button>
```

**New code:**
```tsx
<Button
    size="sm"
    variant="outline"
    className="h-9 px-3 text-muted-foreground hover:text-foreground"
    onClick={() => {
        startTransition(async () => {
            await skipTask(task.id);
            const { task: nextTask } = await getNextTask(projectId, task.id);
            if (nextTask) {
                await toggleTaskCurrent(nextTask.id, projectId);
                toast.info("Task skipped", { description: `Next: ${nextTask.title}` });
            } else {
                toast.info("Task skipped — no more tasks in queue.");
            }
        });
    }}
    disabled={isPending}
    title="Skip to next task"
>
    <SkipForward className="w-4 h-4 mr-1" /> Skip
</Button>
```

Update imports at the top of the file:
- Add `SkipForward` to the lucide-react import
- Add `skipTask` to the flow-board import: `import { addSubtask, toggleSubtask, logTime, unsetCurrentTask, toggleTaskCurrent, skipTask } from "@/lib/actions/flow-board";`
- Remove `MoreHorizontal` from imports (no longer used)

---

## SPRINT 3 — Visual & UX Polish (P2)

### 3.1 Time-aware moon icon in `src/components/layout/context-bar.tsx`

In the cockpit mode Plan link (line 59), make the Moon icon conditional on time of day:

**Old code (line 59-62):**
```tsx
<Link href="/plan" className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent text-sm font-medium transition-colors">
    <Moon className="w-4 h-4" />
    <span className="hidden sm:inline">Plan</span>
</Link>
```

**New code:**
```tsx
<Link href="/plan" className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent text-sm font-medium transition-colors">
    {new Date().getHours() >= 18 ? (
        <Moon className="w-4 h-4 text-indigo-400" />
    ) : (
        <CalendarCheck className="w-4 h-4" />
    )}
    <span className="hidden sm:inline">Plan</span>
</Link>
```

Add `CalendarCheck` to the lucide-react import at the top.

### 3.2 Horizontal Zone 2 (conveyor belt) in `src/components/features/focus/TodayQueueZone.tsx`

Replace the entire component with this horizontal conveyor belt layout:

```tsx
"use client";

import { Task } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { toggleTaskCurrent } from "@/lib/actions/flow-board";
import { useTransition } from "react";

interface TodayQueueZoneProps {
    tasks: Task[];
    projectId: string;
    sprintTaskCount?: number;     // Total sprint tasks not committed today
    committedTodayCount?: number; // How many were committed today
}

export function TodayQueueZone({ tasks, projectId, sprintTaskCount = 0 }: TodayQueueZoneProps) {
    const [isPending, startTransition] = useTransition();

    const handleStart = (taskId: string) => {
        startTransition(async () => {
            await toggleTaskCurrent(taskId, projectId);
        });
    };

    if (tasks.length === 0) {
        return (
            <div className="text-center py-4 text-sm text-muted-foreground bg-muted/20 border border-dashed rounded-lg">
                Queue is empty. Add tasks from the board.
            </div>
        );
    }

    // Separate done tasks (show on left, grayed) and pending (show on right)
    const doneTasks = tasks.filter(t => t.status === 'Done');
    const pendingTasks = tasks.filter(t => t.status !== 'Done');

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Today&apos;s Queue ({tasks.length})
                </h3>
                {sprintTaskCount > 0 && (
                    <span className="text-[10px] text-muted-foreground/60">
                        {sprintTaskCount} sprint tasks not committed today
                    </span>
                )}
            </div>

            {/* Horizontal conveyor belt */}
            <div className="flex flex-row gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {/* Done tasks first (left side, grayed) */}
                {doneTasks.map(task => (
                    <div key={task.id} className="shrink-0 w-[160px] p-3 bg-muted/30 border border-border/50 rounded-lg opacity-60">
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-[10px] uppercase font-bold text-green-600">Done</span>
                        </div>
                        <span className="text-sm font-medium line-clamp-2 line-through text-muted-foreground">{task.title}</span>
                        {task.story_points && (
                            <span className="text-[10px] text-muted-foreground mt-1 block">{task.story_points} pts</span>
                        )}
                    </div>
                ))}

                {/* Pending tasks (right side, active) */}
                {pendingTasks.map(task => (
                    <div key={task.id} className="shrink-0 w-[160px] group relative p-3 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className={`w-2 h-2 rounded-full ${task.status === 'In Progress' ? 'bg-primary animate-pulse' : 'bg-secondary'}`} />
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">{task.status}</span>
                        </div>
                        <span className="text-sm font-medium line-clamp-2">{task.title}</span>
                        <div className="flex items-center justify-between mt-2">
                            {task.story_points && (
                                <span className="text-[10px] text-muted-foreground">{task.story_points} pts</span>
                            )}
                            {task.priority === 'High' && (
                                <span className="text-[10px] font-bold text-red-500">HIGH</span>
                            )}
                        </div>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full h-6 w-6 hover:bg-primary/10 hover:text-primary"
                            onClick={() => handleStart(task.id)}
                            disabled={isPending}
                        >
                            <Play className="w-3 h-3 fill-current ml-0.5" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
```

### 3.3 Dual progress bars in `src/components/features/focus/DoneRibbon.tsx`

Replace the entire component with this version that adds sprint + committed progress bars:

```tsx
"use client";

import { useMemo } from "react";
import { Task, Sprint } from "@/types/database";
import { cn } from "@/lib/utils";
import { CheckCircle2, Target, Gauge } from "lucide-react";

interface DoneRibbonProps {
    completedTasks: Task[];
    dailyGoal?: number;
    activeSprint?: Sprint | null;
    allSprintTasks?: Task[];
    committedTasksToday?: Task[];
}

export function DoneRibbon({ completedTasks, dailyGoal = 5, activeSprint, allSprintTasks = [], committedTasksToday = [] }: DoneRibbonProps) {
    const todayCompleted = useMemo(() => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return completedTasks.filter(t => {
            if (!t.updated_at) return false;
            return new Date(t.updated_at) >= startOfDay;
        });
    }, [completedTasks]);

    const count = todayCompleted.length;
    const points = todayCompleted.reduce((sum, t) => sum + (t.story_points || 0), 0);
    const progressPercentage = Math.min((count / dailyGoal) * 100, 100);

    // Sprint progress
    const sprintDone = allSprintTasks.filter(t => t.status === 'Done').length;
    const sprintTotal = allSprintTasks.length;
    const sprintPct = sprintTotal > 0 ? Math.round((sprintDone / sprintTotal) * 100) : 0;

    // Committed today progress
    const committedDone = committedTasksToday.filter(t => t.status === 'Done').length;
    const committedTotal = committedTasksToday.length;
    const committedPct = committedTotal > 0 ? Math.round((committedDone / committedTotal) * 100) : 0;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border z-40 flex items-center px-6 justify-between shadow-lg"
             style={{ height: activeSprint ? '3.5rem' : '3rem' }}>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle2 className={cn("w-4 h-4", count > 0 ? "text-green-500" : "text-muted-foreground")} />
                    <span className="text-foreground">{count}</span>
                    <span className="text-muted-foreground text-xs">tasks</span>
                </div>
                <div className="h-4 w-[1px] bg-border" />
                <div className="flex items-center gap-2 text-sm font-medium">
                    <Target className={cn("w-4 h-4", points > 0 ? "text-blue-500" : "text-muted-foreground")} />
                    <span className="text-foreground">{points}</span>
                    <span className="text-muted-foreground text-xs">pts</span>
                </div>
            </div>

            {/* Progress bars */}
            <div className="flex items-center gap-4 w-1/2 max-w-lg">
                {/* Daily goal */}
                <div className="flex items-center gap-2 flex-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider whitespace-nowrap">Daily</span>
                    <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{Math.round(progressPercentage)}%</span>
                </div>

                {/* Sprint progress (only if sprint active) */}
                {activeSprint && sprintTotal > 0 && (
                    <div className="flex items-center gap-2 flex-1">
                        <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider whitespace-nowrap">Sprint</span>
                        <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500" style={{ width: `${sprintPct}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{sprintPct}%</span>
                    </div>
                )}

                {/* Committed today progress */}
                {committedTotal > 0 && (
                    <div className="flex items-center gap-2 flex-1">
                        <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider whitespace-nowrap">Committed</span>
                        <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500" style={{ width: `${committedPct}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{committedPct}%</span>
                    </div>
                )}
            </div>
        </div>
    );
}
```

### 3.4 Update DoneRibbon props in FlowBoard.tsx

In `src/components/features/focus/FlowBoard.tsx`, update the DoneRibbon usage (currently line 316):

**Old:**
```tsx
<DoneRibbon completedTasks={completedTasks} />
```

**New:**
```tsx
<DoneRibbon
    completedTasks={completedTasks}
    activeSprint={activeSprint}
    allSprintTasks={sprintTasks}
    committedTasksToday={queueTasks.concat(completedTasks.filter(t => t.committed_date === today))}
/>
```

Also update the TodayQueueZone usage to pass new props. In the Zone 2 section (line ~281):

**Old:**
```tsx
<TodayQueueZone tasks={queueTasks} projectId={project.id} />
```

**New:**
```tsx
<TodayQueueZone
    tasks={queueTasks}
    projectId={project.id}
    sprintTaskCount={sprintRemainderTasks.length}
/>
```

### 3.5 Board View — New file `src/components/features/focus/BoardView.tsx`

Create this new file:

```tsx
"use client";

import { Task, Sprint } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Play, AlertCircle } from "lucide-react";
import { toggleTaskCurrent, updateTaskStatus } from "@/lib/actions/flow-board";
import { useTransition } from "react";

interface BoardViewProps {
    tasks: Task[];
    activeSprint: Sprint | null;
    projectId: string;
}

export function BoardView({ tasks, activeSprint, projectId }: BoardViewProps) {
    const [isPending, startTransition] = useTransition();

    // Filter tasks into columns
    const sprintTasks = activeSprint ? tasks.filter(t => t.sprint_id === activeSprint.id) : tasks;
    const todoTasks = sprintTasks.filter(t => t.status === 'Todo');
    const inProgressTasks = sprintTasks.filter(t => t.status === 'In Progress');
    const doneTasks = sprintTasks.filter(t => t.status === 'Done');
    const blockedTasks = sprintTasks.filter(t => t.status === 'Blocked');
    const backlogTasks = tasks.filter(t => !t.sprint_id && t.status !== 'Done');

    const handleStart = (taskId: string) => {
        startTransition(async () => {
            await updateTaskStatus(taskId, "In Progress");
            await toggleTaskCurrent(taskId, projectId);
        });
    };

    const Column = ({ title, tasks, color }: { title: string; tasks: Task[]; color: string }) => (
        <div className="flex-1 min-w-[200px]">
            <div className={`text-xs uppercase tracking-wider font-bold mb-3 flex items-center gap-2 ${color}`}>
                <span className="w-2 h-2 rounded-full bg-current" />
                {title} ({tasks.length})
            </div>
            <div className="space-y-2">
                {tasks.map(task => (
                    <div key={task.id} className="group p-3 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-medium line-clamp-2 flex-1">{task.title}</span>
                            {title === 'TODO' && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                    onClick={() => handleStart(task.id)}
                                    disabled={isPending}
                                >
                                    <Play className="w-3 h-3" />
                                </Button>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                            {task.story_points && <span className="bg-muted px-1.5 py-0.5 rounded">{task.story_points} pts</span>}
                            {task.priority === 'High' && <span className="text-red-500 font-bold">HIGH</span>}
                            {task.skip_count && task.skip_count > 0 && <span className="text-orange-500">Skipped {task.skip_count}x</span>}
                        </div>
                    </div>
                ))}
                {tasks.length === 0 && (
                    <div className="text-xs text-muted-foreground italic py-4 text-center">No tasks</div>
                )}
            </div>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col gap-6 min-h-0 overflow-y-auto">
            {/* Main 3-column board */}
            <div className="flex gap-4 min-h-[300px]">
                <Column title="TODO" tasks={todoTasks} color="text-muted-foreground" />
                <Column title="IN PROGRESS" tasks={inProgressTasks} color="text-blue-500" />
                <Column title="DONE" tasks={doneTasks} color="text-green-500" />
            </div>

            {/* Blocked section */}
            {blockedTasks.length > 0 && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                    <h4 className="text-xs uppercase tracking-wider font-bold text-red-500 flex items-center gap-2 mb-3">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Blocked ({blockedTasks.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {blockedTasks.map(task => (
                            <div key={task.id} className="p-2 bg-background/50 rounded border border-red-500/10 text-sm">
                                {task.title}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Collapsible Backlog */}
            {backlogTasks.length > 0 && (
                <details className="border border-border rounded-lg">
                    <summary className="cursor-pointer p-3 text-xs uppercase tracking-wider font-bold text-muted-foreground hover:bg-muted/50 transition-colors">
                        Backlog ({backlogTasks.length})
                    </summary>
                    <div className="p-3 pt-0 space-y-2">
                        {backlogTasks.map(task => (
                            <div key={task.id} className="p-2 bg-muted/20 rounded text-sm flex items-center justify-between">
                                <span>{task.title}</span>
                                {task.story_points && <span className="text-[10px] text-muted-foreground">{task.story_points} pts</span>}
                            </div>
                        ))}
                    </div>
                </details>
            )}
        </div>
    );
}
```

### 3.6 Wire BoardView into FlowBoard.tsx

In `src/components/features/focus/FlowBoard.tsx`, add the import at the top:

```tsx
import { BoardView } from "./BoardView";
```

Replace the Board View placeholder (the `{viewMode === 'board' && ...}` block):

**Old:**
```tsx
{viewMode === 'board' && (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Board View Coming Soon (Use Flow View for now)
    </div>
)}
```

**New:**
```tsx
{viewMode === 'board' && (
    <BoardView tasks={tasks} activeSprint={activeSprint} projectId={project.id} />
)}
```

---

## SPRINT 4 — Scope Protection UI + Deferred Items

### 4.1 Scope protection labeling in `src/components/features/focus/SprintBacklogZone.tsx`

The "Project Backlog" section in FlowBoard already labels itself correctly. But inside `SprintBacklogZone.tsx`, when an active sprint exists, any task added should be labeled as going to backlog, not to sprint.

This is already handled by the zone IDs in FlowBoard drag-and-drop (`project-backlog-zone` vs `sprint-backlog-zone`). No code change needed — just add a `// TODO: GAP-11 - Consider adding toast "Task added to sprint (+1 scope change)" when moveTaskToSprint is called during active sprint` comment in `flow-board.ts` at the top.

### 4.2 Add P3 TODO comments

Add these TODO comments to the relevant files:

In `src/components/features/focus/FlowBoard.tsx` at the top (after imports):
```ts
// TODO: GAP-13 (P3) — Timeline view mode (Gantt-style sprint timeline)
// TODO: GAP-15 (P3) — 3 PM nudge notification for uncommitted tasks
// TODO: GAP-16 (P3) — End-of-day auto-summary generation
// TODO: GAP-18 (P3) — Task completion confetti/celebration animation
```

In `src/lib/actions/flow-board-next.ts` at the top (after imports):
```ts
// TODO: GAP-14 (P3) — Smarter next-task scoring (skip_count penalty, priority weighting, deadline proximity)
```

---

## Verification Checklist

After all sprints, run:

```bash
npm run build
```

And verify:
1. No TypeScript errors
2. All imports resolve
3. New `BoardView.tsx` file exists
4. `completeSprint` accepts optional `taskDecisions` parameter
5. `skipTask` function exists in `flow-board.ts`
6. `DoneRibbon` accepts new optional props without breaking existing usage
7. `TodayQueueZone` has horizontal layout with `flex flex-row`
8. `context-bar.tsx` conditionally renders Moon vs CalendarCheck based on hour
