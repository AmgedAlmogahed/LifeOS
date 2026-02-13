"use client";

// TODO: GAP-13 (P3) — Timeline view mode (Gantt-style sprint timeline)
// TODO: GAP-15 (P3) — 3 PM nudge notification for uncommitted tasks
// TODO: GAP-16 (P3) — End-of-day auto-summary generation
// TODO: GAP-18 (P3) — Task completion confetti/celebration animation

import { useTransition, useState, useEffect, useCallback } from "react";
import { Sprint, Task, FocusSession } from "@/types/database";
import { CurrentTaskZone } from "./CurrentTaskZone";
import { TodayQueueZone } from "./TodayQueueZone";
import { SprintBacklogZone } from "./SprintBacklogZone";
import { BoardView } from "./BoardView";
import { Button } from "@/components/ui/button";
import { Clock, Play, LayoutTemplate, KanbanSquare, LogOut } from "lucide-react";
import { endFocusSession } from "@/lib/actions/focus-sessions";
import { DoneRibbon } from "./DoneRibbon";
import { SprintReview } from "../sprints/SprintReview";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { moveTaskToSprint, updateTaskStatus, toggleTaskCurrent } from "@/lib/actions/flow-board";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

interface FlowBoardProps {
    project: { id: string; name: string };
    activeSprint: Sprint | null;
    tasks: Task[];
    activeSession: FocusSession; // No longer nullable — session is guaranteed by page.tsx
}

type ViewMode = "flow" | "board" | "timeline";

export function FlowBoard({ project, activeSprint, tasks, activeSession }: FlowBoardProps) {
    const [isPending, startTransition] = useTransition();
    const [viewMode, setViewMode] = useState<ViewMode>("flow");
    const [showSprintReview, setShowSprintReview] = useState(false);
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);

    // Navigation guard state
    const [showEndModal, setShowEndModal] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
    const [sessionNotes, setSessionNotes] = useState("");
    const [isEnding, setIsEnding] = useState(false);
    const router = useRouter();

    // Filter tasks
    const today = new Date().toISOString().split('T')[0];

    const sprintTasks = activeSprint ? tasks.filter(t => t.sprint_id === activeSprint.id) : [];
    const backlogTasks = tasks.filter(t => 
        t.status !== 'Done' && 
        (!activeSprint || t.sprint_id !== activeSprint.id) &&
        !t.is_current &&
        t.committed_date !== today &&
        t.status !== 'In Progress'
    );
    const completedTasks = activeSprint ? tasks.filter(t => t.sprint_id === activeSprint.id && t.status === 'Done') : [];

    // Focus Zones logic
    const currentTask = tasks.find(t => t.is_current);

    // Queue: Tasks committed for today OR tasks in progress but not current
    const queueTasks = tasks.filter(t =>
        (t.committed_date === today || t.status === 'In Progress') &&
        !t.is_current &&
        t.status !== 'Done'
    );

    // Sprint Remainder: Tasks in sprint, status 'Todo', but NOT committed for today
    const sprintRemainderTasks = sprintTasks.filter(t =>
        t.status === 'Todo' &&
        !t.is_current &&
        t.committed_date !== today
    );

    // ─── Navigation Guard ───────────────────────────────────────────────
    // Warn on browser close/refresh
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            // Modern browsers show a generic message regardless of returnValue
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, []);

    // Intercept in-app link clicks that navigate away from /focus
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest("a");
            if (!anchor) return;

            const href = anchor.getAttribute("href");
            if (!href) return;

            // Only intercept internal links that leave the focus page
            if (href.startsWith("/") && !href.startsWith(`/focus/${project.id}`)) {
                e.preventDefault();
                e.stopPropagation();
                setPendingNavigation(href);
                setShowEndModal(true);
            }
        };

        document.addEventListener("click", handleClick, true);
        return () => document.removeEventListener("click", handleClick, true);
    }, [project.id]);

    const handleEndSession = useCallback(async () => {
        setIsEnding(true);
        try {
            await endFocusSession(activeSession.id, sessionNotes || null);
            setShowEndModal(false);
            if (pendingNavigation) {
                router.push(pendingNavigation);
            } else {
                router.push("/cockpit");
            }
        } catch {
            // If end fails, still allow navigation
            if (pendingNavigation) {
                router.push(pendingNavigation);
            }
        } finally {
            setIsEnding(false);
            setPendingNavigation(null);
            setSessionNotes("");
        }
    }, [activeSession.id, sessionNotes, pendingNavigation, router]);

    const handleCancelEnd = () => {
        setShowEndModal(false);
        setPendingNavigation(null);
        setSessionNotes("");
    };

    // ─── Drag & Drop ────────────────────────────────────────────────────
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const task = tasks.find(t => t.id === active.id);
        if (task) setDraggedTask(task);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setDraggedTask(null);

        if (!over) return;

        const taskId = active.id as string;
        const overId = over.id as string;

        startTransition(async () => {
            if (overId === "current-zone") {
                await updateTaskStatus(taskId, "In Progress");
            } else if (overId === "queue-zone") {
                await updateTaskStatus(taskId, "In Progress");
                await moveTaskToSprint(taskId, activeSprint?.id || null, project.id);
            } else if (overId === "sprint-backlog-zone") {
                await updateTaskStatus(taskId, "Todo");
                await moveTaskToSprint(taskId, activeSprint?.id || null, project.id);
            } else if (overId === "project-backlog-zone") {
                await updateTaskStatus(taskId, "Todo");
                await moveTaskToSprint(taskId, null, project.id);
            }
        });
    };

    const handleCompleteSprint = () => {
        setShowSprintReview(true);
    };

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="h-full flex flex-col gap-6 relative px-4 md:px-6 pt-4 pb-16">
                {/* Header */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                    {/* Session indicator — always active (no toggle needed) */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-full border border-green-500/20">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-semibold">Focused</span>
                    </div>

                    {/* End Session button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowEndModal(true)}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                    >
                        <LogOut className="w-4 h-4 mr-1" />
                        <span className="text-xs">End Session</span>
                    </Button>

                    {activeSprint && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full border border-border">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-xs font-semibold truncate max-w-[200px]">Sprint {activeSprint.sprint_number}: {activeSprint.goal}</span>
                            <Button variant="ghost" size="sm" className="h-5 px-2 text-[10px] ml-1 text-muted-foreground hover:text-foreground" onClick={handleCompleteSprint}>
                                Complete
                            </Button>
                        </div>
                    )}

                    <div className="flex bg-muted rounded-lg p-0.5 ml-auto">
                        <Button variant={viewMode === 'flow' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('flow')} title="Flow View">
                            <LayoutTemplate className="w-4 h-4" />
                        </Button>
                        <Button variant={viewMode === 'board' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('board')} title="Board View">
                            <KanbanSquare className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Zones Layout (Flow Mode) */}
                {viewMode === 'flow' && (
                    <div className="flex-1 flex flex-col gap-6 min-h-0 overflow-y-auto scrollbar-thin">

                        {/* Zone 1: Current Task */}
                        <div id="current-zone" className="shrink-0">
                            {currentTask ? (
                                <CurrentTaskZone
                                    task={currentTask}
                                    session={activeSession}
                                    projectId={project.id}
                                />
                            ) : (
                                /* Empty State / Suggestion */
                                (() => {
                                    const suggestedTask = queueTasks[0] || sprintRemainderTasks[0] || backlogTasks[0];

                                    if (suggestedTask) {
                                        return (
                                            <div className="bg-card rounded-xl border border-primary/20 shadow-lg p-6 relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                                                <div className="flex flex-col gap-4">
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                                            What&apos;s Next?
                                                        </span>
                                                        <h3 className="text-xl font-bold">{suggestedTask.title}</h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {suggestedTask.sprint_id ? "From current sprint" : "From backlog"} &bull; {suggestedTask.priority} Priority
                                                        </p>
                                                    </div>

                                                    <div className="flex gap-3 pt-2">
                                                        <Button
                                                            onClick={async () => {
                                                                startTransition(async () => {
                                                                    await updateTaskStatus(suggestedTask.id, "In Progress");
                                                                    await toggleTaskCurrent(suggestedTask.id, project.id);
                                                                });
                                                            }}
                                                            className="w-full sm:w-auto"
                                                        >
                                                            <Play className="w-4 h-4 mr-2" /> Start This Task
                                                        </Button>
                                                        <Button variant="outline" className="w-full sm:w-auto">
                                                            Pick from Queue
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div className="h-48 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground gap-2 bg-muted/10">
                                                <Clock className="w-8 h-8 opacity-20" />
                                                <p className="text-sm">No tasks available. Add some to get started!</p>
                                            </div>
                                        );
                                    }
                                })()
                            )}
                        </div>

                        {/* Zone 2: Queue */}
                        <div id="queue-zone" className="shrink-0">
                            <TodayQueueZone
                                tasks={queueTasks}
                                projectId={project.id}
                                sprintTaskCount={sprintRemainderTasks.length}
                            />
                        </div>

                        {/* Zone 3: Boards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div id="sprint-backlog-zone" className="min-h-[200px]">
                                <SprintBacklogZone
                                    tasks={sprintRemainderTasks}
                                    completedTasks={completedTasks}
                                    projectId={project.id}
                                />
                            </div>
                            <div id="project-backlog-zone" className="min-h-[200px] border-l border-border/50 pl-6 border-dashed">
                                <div className="mb-4">
                                    <h3 className="text-sm font-medium text-muted-foreground">Project Backlog</h3>
                                    <p className="text-xs text-muted-foreground/60">Tasks not in sprint</p>
                                </div>
                                <SprintBacklogZone
                                    tasks={backlogTasks}
                                    completedTasks={[]}
                                    projectId={project.id}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'board' && (
                    <BoardView tasks={tasks} activeSprint={activeSprint} projectId={project.id} />
                )}

                {/* Persistent Done Ribbon */}
                <DoneRibbon
                    completedTasks={completedTasks}
                    activeSprint={activeSprint}
                    allSprintTasks={sprintTasks}
                    committedTasksToday={queueTasks.concat(completedTasks.filter(t => t.committed_date === today))}
                />

                {/* Sprint Review Modal */}
                {activeSprint && (
                    <SprintReview
                        sprint={activeSprint}
                        tasks={tasks.filter(t => t.sprint_id === activeSprint.id)}
                        open={showSprintReview}
                        onOpenChange={setShowSprintReview}
                    />
                )}

                <DragOverlay>
                    {draggedTask ? (
                        <div className="p-3 bg-card border border-border rounded-lg shadow-xl opacity-80 w-[300px]">
                            {draggedTask.title}
                        </div>
                    ) : null}
                </DragOverlay>

                {/* End Session Modal (Navigation Guard) */}
                <Dialog open={showEndModal} onOpenChange={(open) => !open && handleCancelEnd()}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>End Focus Session?</DialogTitle>
                            <DialogDescription>
                                {pendingNavigation
                                    ? "You're navigating away from Focus mode. This will end your current session."
                                    : "Ready to wrap up this focus session?"
                                }
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Session Notes (optional)</label>
                                <Textarea
                                    placeholder="What did you accomplish? Any blockers or insights?"
                                    value={sessionNotes}
                                    onChange={(e) => setSessionNotes(e.target.value)}
                                    className="min-h-[80px] resize-none"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" onClick={handleCancelEnd} disabled={isEnding}>
                                    Stay Focused
                                </Button>
                                <Button onClick={handleEndSession} disabled={isEnding}>
                                    {isEnding ? "Ending..." : "End Session"}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </DndContext>
    );
}
