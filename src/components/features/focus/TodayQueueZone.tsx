"use client";

import { Task } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Play, CalendarClock } from "lucide-react";
import { toggleTaskCurrent } from "@/lib/actions/flow-board";
import { useTransition } from "react";
import { DraggableTaskCard } from "./DraggableTaskCard";
import { formatDistanceToNow, isPast } from "date-fns";
import { cn } from "@/lib/utils";

interface TodayQueueZoneProps {
    tasks: Task[];
    projectId: string;
    sprintTaskCount?: number;
    committedTodayCount?: number;
    onTaskClick?: (task: Task) => void;
}

export function TodayQueueZone({ tasks, projectId, sprintTaskCount = 0, onTaskClick }: TodayQueueZoneProps) {
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
            <div className="flex flex-row gap-3 overflow-x-auto pb-3 scrollbar-thin">
                {/* Done tasks first (left side, grayed) */}
                {doneTasks.map(task => (
                    <div
                        key={task.id}
                        className="shrink-0 w-[160px] min-h-[100px] p-3 bg-muted/30 border border-border/50 rounded-lg opacity-60 cursor-pointer"
                        onClick={() => onTaskClick?.(task)}
                    >
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-[10px] uppercase font-bold text-green-600">Done</span>
                        </div>
                        <span className="text-sm font-medium line-clamp-2 line-through text-muted-foreground">{task.title}</span>
                        {task.story_points && (
                            <span className="text-[10px] text-muted-foreground mt-1.5 block">{task.story_points} pts</span>
                        )}
                        {task.due_date && (
                            <span className="text-[10px] text-muted-foreground mt-1 block">
                                Due {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
                            </span>
                        )}
                    </div>
                ))}

                {/* Pending tasks (right side, active) */}
                {pendingTasks.map(task => (
                    <DraggableTaskCard key={task.id} task={task}>
                        <div
                            className="shrink-0 w-[160px] min-h-[100px] group relative p-3 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-all"
                            onClick={() => onTaskClick?.(task)}
                        >
                            <div className="flex items-center gap-1.5 mb-1.5">
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
                            {/* Due date display */}
                            {task.due_date && (
                                <span className={cn(
                                    "text-[10px] mt-1 flex items-center gap-0.5 block",
                                    isPast(new Date(task.due_date)) ? "text-red-500" : "text-muted-foreground"
                                )}>
                                    <CalendarClock className="w-2.5 h-2.5" />
                                    {isPast(new Date(task.due_date)) ? "Overdue" : formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
                                </span>
                            )}
                            <Button
                                size="icon"
                                variant="ghost"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full h-6 w-6 hover:bg-primary/10 hover:text-primary"
                                onClick={(e) => { e.stopPropagation(); handleStart(task.id); }}
                                disabled={isPending}
                            >
                                <Play className="w-3 h-3 fill-current ml-0.5" />
                            </Button>
                        </div>
                    </DraggableTaskCard>
                ))}
            </div>
        </div>
    );
}
