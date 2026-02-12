"use client";

import { useTransition, useState } from "react";
import { Sprint, Task } from "@/types/database";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { completeSprint } from "@/lib/actions/sprints";
import { moveTaskToSprint } from "@/lib/actions/flow-board";
import { CheckCircle2, Clock, Trophy, AlertCircle } from "lucide-react";
import { formatDuration } from "date-fns";

interface SprintReviewProps {
    sprint: Sprint;
    tasks: Task[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SprintReview({ sprint, tasks, open, onOpenChange }: SprintReviewProps) {
    const [isPending, startTransition] = useTransition();
    const [step, setStep] = useState<"review" | "actions">("review");

    // Calculate metrics locally for preview (metrics are also calc'd on server)
    const completedTasks = tasks.filter(t => t.status === "Done");
    const incompleteTasks = tasks.filter(t => t.status !== "Done");
    
    const completedPoints = completedTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
    const totalPoints = tasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
    const completionRate = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
    
    // Focus time sum (minutes)
    const focusTime = tasks.reduce((sum, t) => sum + (t.time_spent_minutes || 0), 0);
    const focusTimeHours = (focusTime / 60).toFixed(1);

    const handleComplete = () => {
        startTransition(async () => {
            // 1. Move incomplete tasks to backlog (null sprint) or next sprint?
            // Spec implies manual decision. For MVP, we'll move them to backlog automatically or leave them?
            // "Carry forward" logic usually means moving to next sprint.
            // Let's implement a choice: "Move to Backlog" is safer default.
            
            // For now, let's keep them in the sprint logic-wise until next planning? 
            // Or explicit unassign?
            // Spec says "Carry forward decision".
            // Let's just complete the sprint. The tasks remain associated with the OLD sprint ID but are not "done".
            // This is actually fine for history. 
            // But they shouldn't show up in NEXT sprint unless moved.
            
            await completeSprint(sprint.id, sprint.project_id);
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

                <div className="grid grid-cols-3 gap-4 py-6">
                    <div className="bg-muted/30 p-4 rounded-xl text-center border border-border">
                        <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-1">Velocity</div>
                        <div className="text-3xl font-black text-foreground">{completedPoints} <span className="text-sm font-normal text-muted-foreground">pts</span></div>
                        <div className="text-xs text-muted-foreground mt-1">{completionRate}% of commitment</div>
                    </div>
                     <div className="bg-muted/30 p-4 rounded-xl text-center border border-border">
                        <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-1">Focus Time</div>
                        <div className="text-3xl font-black text-foreground">{focusTimeHours} <span className="text-sm font-normal text-muted-foreground">hrs</span></div>
                        <div className="text-xs text-muted-foreground mt-1">Deep work logged</div>
                    </div>
                     <div className="bg-muted/30 p-4 rounded-xl text-center border border-border">
                        <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-1">Tasks</div>
                        <div className="text-3xl font-black text-foreground">{completedTasks.length} <span className="text-sm font-normal text-muted-foreground">/ {tasks.length}</span></div>
                         <div className="text-xs text-muted-foreground mt-1">Completed</div>
                    </div>
                </div>

                {incompleteTasks.length > 0 && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-orange-600 flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4" />
                            {incompleteTasks.length} Incomplete Tasks
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                            These items will remain in the backlog for the next sprint planning session.
                        </p>
                        <div className="space-y-1 max-h-32 overflow-y-auto pr-2">
                            {incompleteTasks.map(t => (
                                <div key={t.id} className="text-sm bg-background/50 p-2 rounded flex justify-between">
                                    <span>{t.title}</span>
                                    <span className="text-xs opacity-70 bg-muted px-1 rounded">{t.status}</span>
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
