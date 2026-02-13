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

    const Column = ({ title, columnTasks, color }: { title: string; columnTasks: Task[]; color: string }) => (
        <div className="flex-1 min-w-0">
            <div className={`text-xs uppercase tracking-wider font-bold mb-3 flex items-center gap-2 ${color}`}>
                <span className="w-2 h-2 rounded-full bg-current" />
                {title} ({columnTasks.length})
            </div>
            <div className="space-y-2">
                {columnTasks.map(task => (
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
                {columnTasks.length === 0 && (
                    <div className="text-xs text-muted-foreground italic py-4 text-center">No tasks</div>
                )}
            </div>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col gap-6 min-h-0 overflow-y-auto scrollbar-thin">
            {/* Main 3-column board */}
            <div className="flex gap-6 min-h-[300px]">
                <Column title="TODO" columnTasks={todoTasks} color="text-muted-foreground" />
                <Column title="IN PROGRESS" columnTasks={inProgressTasks} color="text-blue-500" />
                <Column title="DONE" columnTasks={doneTasks} color="text-green-500" />
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
                    <summary className="cursor-pointer px-4 py-3 text-xs uppercase tracking-wider font-bold text-muted-foreground hover:bg-muted/50 transition-colors rounded-lg">
                        Backlog ({backlogTasks.length})
                    </summary>
                    <div className="px-4 pb-4 pt-1 space-y-2">
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
