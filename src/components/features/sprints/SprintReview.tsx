"use client";

import { useTransition, useState } from "react";
import { Sprint, Task } from "@/types/database";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { completeSprint } from "@/lib/actions/sprints";
import { CheckCircle2, Clock, Trophy, AlertCircle } from "lucide-react";

interface SprintReviewProps {
    sprint: Sprint;
    tasks: Task[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SprintReview({ sprint, tasks, open, onOpenChange }: SprintReviewProps) {
    const [isPending, startTransition] = useTransition();

    // Calculate metrics locally for preview (metrics are also calc'd on server)
    const completedTasks = tasks.filter(t => t.status === "Done");
    const incompleteTasks = tasks.filter(t => t.status !== "Done");

    const completedPoints = completedTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
    const totalPoints = tasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
    const completionRate = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

    // Focus time sum (minutes)
    const focusTime = tasks.reduce((sum, t) => sum + (t.time_spent_minutes || 0), 0);
    const focusTimeHours = (focusTime / 60).toFixed(1);

    const [taskDecisions, setTaskDecisions] = useState<Record<string, 'carry' | 'backlog' | 'drop'>>(() => {
        const initial: Record<string, 'carry' | 'backlog' | 'drop'> = {};
        tasks.filter(t => t.status !== "Done").forEach(t => { initial[t.id] = 'carry'; });
        return initial;
    });

    const handleComplete = () => {
        startTransition(async () => {
            const carryForward = Object.entries(taskDecisions).filter(([, v]) => v === 'carry').map(([id]) => id);
            const backlog = Object.entries(taskDecisions).filter(([, v]) => v === 'backlog').map(([id]) => id);
            const drop = Object.entries(taskDecisions).filter(([, v]) => v === 'drop').map(([id]) => id);

            await completeSprint(sprint.id, sprint.project_id, { carryForward, backlog, drop });
            onOpenChange(false);
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        Sprint Complete!
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-3 gap-3 py-4">
                    <div className="bg-muted/30 p-3 rounded-xl text-center border border-border">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Velocity</div>
                        <div className="text-2xl font-black text-foreground">{completedPoints} <span className="text-xs font-normal text-muted-foreground">pts</span></div>
                        <div className="text-[10px] text-muted-foreground mt-1">{completionRate}% of commitment</div>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-xl text-center border border-border">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Focus Time</div>
                        <div className="text-2xl font-black text-foreground">{focusTimeHours} <span className="text-xs font-normal text-muted-foreground">hrs</span></div>
                        <div className="text-[10px] text-muted-foreground mt-1">Deep work logged</div>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-xl text-center border border-border">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Tasks</div>
                        <div className="text-2xl font-black text-foreground">{completedTasks.length} <span className="text-xs font-normal text-muted-foreground">/ {tasks.length}</span></div>
                        <div className="text-[10px] text-muted-foreground mt-1">Completed</div>
                    </div>
                </div>

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

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleComplete} disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white">
                        {isPending ? "Closing Sprint..." : "Confirm & Close Sprint"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
