"use client";

import { useState } from "react";
import { Project, Task } from "@/types/database";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { commitTasks } from "@/lib/actions/tasks";
import { format, addDays } from "date-fns";
import { toast } from "sonner";
import { CalendarCheck, Loader2 } from "lucide-react";

interface ProjectWithTasks extends Project {
    tasks: Task[]; // Assumed joined
}

interface TaskCommitmentProps {
    projects: ProjectWithTasks[];
}

export function TaskCommitment({ projects }: TaskCommitmentProps) {
    // Flatten tasks and filter eligible ones (not done)
    // Actually props should probably come tailored.
    // Assuming projects have .tasks property populated with uncompleted tasks.

    const [committedIds, setCommittedIds] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    const tomorrow = addDays(new Date(), 1);
    const dateStr = format(tomorrow, "yyyy-MM-dd");

    function toggleTask(taskId: string) {
        const next = new Set(committedIds);
        if (next.has(taskId)) next.delete(taskId);
        else next.add(taskId);
        setCommittedIds(next);
    }

    async function handleCommit() {
        if (committedIds.size === 0) return;
        setIsSaving(true);
        try {
            await commitTasks(Array.from(committedIds), dateStr);
            toast.success(`Committed to ${committedIds.size} tasks for tomorrow`);
            setCommittedIds(new Set()); // Clear selection? Or show them as committed?
            // Ideally revalidation hides them or marks them.
        } catch (error) {
            toast.error("Failed to commit tasks");
        } finally {
            setIsSaving(false);
        }
    }

    const hasTasks = projects.some(p => p.tasks && p.tasks.length > 0);

    if (!hasTasks) {
        return (
            <section className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-blue-500" />
                    Task Commitment
                </h2>
                <div className="text-muted-foreground text-sm italic">
                    No active tasks to commit to. Adds some in Focus mode!
                </div>
            </section>
        );
    }

    return (
        <section className="space-y-4">
             <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-blue-500" />
                    Commitment for Tomorrow ({format(tomorrow, "EEEE")})
                </h2>
                {committedIds.size > 0 && (
                    <Button size="sm" onClick={handleCommit} disabled={isSaving}>
                        {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Commit to {committedIds.size} Tasks
                    </Button>
                )}
            </div>

            <div className="grid gap-6">
                {projects.map(project => (
                    project.tasks && project.tasks.length > 0 && (
                        <div key={project.id} className="space-y-2">
                            <h3 className="font-medium text-sm text-muted-foreground pl-1">{project.name}</h3>
                            <div className="space-y-2">
                                {project.tasks.map(task => (
                                    <div key={task.id} className="flex items-center space-x-3 bg-card border rounded-lg p-3 hover:bg-accent/50 transition-colors">
                                        <Checkbox 
                                            id={`task-${task.id}`} 
                                            checked={committedIds.has(task.id) || task.committed_date === dateStr}
                                            onCheckedChange={() => toggleTask(task.id)}
                                            disabled={task.committed_date === dateStr}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <label
                                                htmlFor={`task-${task.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {task.title}
                                            </label>
                                            {task.committed_date === dateStr && (
                                                <span className="text-[10px] text-blue-500 font-medium">ALREADY COMMITTED</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                ))}
            </div>
        </section>
    );
}
