"use client";

import { useTransition, useState } from "react";
import { Sprint, Task, FocusSession } from "@/types/database";
import { CurrentTaskZone } from "./CurrentTaskZone";
import { TodayQueueZone } from "./TodayQueueZone";
import { SprintBacklogZone } from "./SprintBacklogZone";
import { Button } from "@/components/ui/button";
import { Clock, Play, Square, LayoutTemplate, KanbanSquare } from "lucide-react";
import { createFocusSession, endFocusSession } from "@/lib/actions/focus-sessions";
import { DoneRibbon } from "./DoneRibbon";
import { SprintReview } from "../sprints/SprintReview";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { moveTaskToSprint, updateTaskStatus, toggleTaskCurrent } from "@/lib/actions/flow-board";

interface FlowBoardProps {
    project: { id: string; name: string };
    activeSprint: Sprint | null;
    tasks: Task[];
    activeSession: FocusSession | null;
}

type ViewMode = "flow" | "board" | "timeline";

export function FlowBoard({ project, activeSprint, tasks, activeSession }: FlowBoardProps) {
    const [isPending, startTransition] = useTransition();
    const [viewMode, setViewMode] = useState<ViewMode>("flow");
    const [showSprintReview, setShowSprintReview] = useState(false);
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);

    // Filter tasks
    const sprintTasks = activeSprint ? tasks.filter(t => t.sprint_id === activeSprint.id) : [];
    const backlogTasks = tasks.filter(t => !t.sprint_id && t.status !== 'Done');
    const completedTasks = activeSprint ? tasks.filter(t => t.sprint_id === activeSprint.id && t.status === 'Done') : [];

    // Focus Zones logic
    const currentTask = sprintTasks.find(t => t.is_current);
    // Queue: Tasks in sprint, status 'In Progress', but not current
    const queueTasks = sprintTasks.filter(t => t.status === 'In Progress' && !t.is_current);
    // Sprint Remainder: Tasks in sprint, status 'Todo'
    const sprintRemainderTasks = sprintTasks.filter(t => t.status === 'Todo' && !t.is_current);

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

    const handleSessionToggle = () => {
        startTransition(async () => {
            if (activeSession) {
                await endFocusSession(activeSession.id, null);
            } else {
                await createFocusSession(project.id);
            }
        });
    };

    const handleCompleteSprint = () => {
        setShowSprintReview(true);
    };

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="h-full flex flex-col gap-6 relative pb-20"> {/* Add padding for DoneRibbon */}
                {/* Header */}
                <div className="flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <Button
                            variant={activeSession ? "destructive" : "default"}
                            onClick={handleSessionToggle}
                            disabled={isPending}
                            className={activeSession ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "bg-primary text-primary-foreground"}
                        >
                            {activeSession ? <Square className="w-4 h-4 mr-2 fill-current" /> : <Play className="w-4 h-4 mr-2 fill-current" />}
                            {activeSession ? "End Focus" : "Start Focus"}
                        </Button>
                        
                        {activeSprint && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full border border-border">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-xs font-semibold">Sprint {activeSprint.sprint_number}: {activeSprint.goal}</span>
                                <Button variant="ghost" size="sm" className="h-5 px-2 text-[10px] ml-2 text-muted-foreground hover:text-foreground" onClick={handleCompleteSprint}>
                                    Complete
                                </Button>
                            </div>
                        )}
                         
                        <div className="flex bg-muted rounded-lg p-0.5 ml-4">
                             <Button variant={viewMode === 'flow' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('flow')} title="Flow View">
                                 <LayoutTemplate className="w-4 h-4" />
                             </Button>
                             <Button variant={viewMode === 'board' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('board')} title="Board View">
                                 <KanbanSquare className="w-4 h-4" />
                             </Button>
                        </div>
                    </div>
                </div>

                {/* Zones Layout (Flow Mode) */}
                {viewMode === 'flow' && (
                    <div className="flex-1 flex flex-col gap-8 min-h-0 overflow-y-auto pr-2 scrollbar-thin">
                        
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
                                    // Logic to find suggestion
                                    const suggestedTask = queueTasks[0] || sprintRemainderTasks[0] || backlogTasks[0];
                                    
                                    if (suggestedTask) {
                                        return (
                                            <div className="bg-card rounded-xl border border-primary/20 shadow-lg p-6 relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                                                <div className="flex flex-col gap-4">
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                                            What's Next?
                                                        </span>
                                                        <h3 className="text-xl font-bold">{suggestedTask.title}</h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {suggestedTask.sprint_id ? "From current sprint" : "From backlog"} • {suggestedTask.priority} Priority
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
                             <TodayQueueZone tasks={queueTasks} projectId={project.id} />
                        </div>

                        {/* Zone 3: Boards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
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
                
                {/* Board View (Placeholder for now, standard Kanban) */}
                {viewMode === 'board' && (
                     <div className="flex-1 flex items-center justify-center text-muted-foreground">
                         Board View Coming Soon (Use Flow View for now)
                     </div>
                )}
                
                {/* Persistent Done Ribbon */}
                <DoneRibbon completedTasks={completedTasks} />
                
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
            </div>
        </DndContext>
    );
}
