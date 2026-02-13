"use client";

import { useMemo } from "react";
import { Task, Sprint } from "@/types/database";
import { cn } from "@/lib/utils";
import { CheckCircle2, Target } from "lucide-react";

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
        <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border z-40 h-12 flex items-center px-4 md:px-6 justify-between shadow-lg">
            {/* Left: Stats */}
            <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                    <CheckCircle2 className={cn("w-4 h-4", count > 0 ? "text-green-500" : "text-muted-foreground")} />
                    <span className="text-foreground">{count}</span>
                    <span className="text-muted-foreground text-xs hidden sm:inline">tasks</span>
                </div>
                <div className="h-4 w-[1px] bg-border" />
                <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Target className={cn("w-4 h-4", points > 0 ? "text-blue-500" : "text-muted-foreground")} />
                    <span className="text-foreground">{points}</span>
                    <span className="text-muted-foreground text-xs hidden sm:inline">pts</span>
                </div>
            </div>

            {/* Right: Progress bars — hidden on mobile, shown md+ */}
            <div className="hidden md:flex items-center gap-4 flex-1 max-w-lg ml-6">
                {/* Daily goal */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider whitespace-nowrap">Daily</span>
                    <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{Math.round(progressPercentage)}%</span>
                </div>

                {/* Sprint progress (only if sprint active) */}
                {activeSprint && sprintTotal > 0 && (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider whitespace-nowrap">Sprint</span>
                        <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500" style={{ width: `${sprintPct}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{sprintPct}%</span>
                    </div>
                )}

                {/* Committed today progress */}
                {committedTotal > 0 && (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider whitespace-nowrap">Today</span>
                        <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500" style={{ width: `${committedPct}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{committedPct}%</span>
                    </div>
                )}
            </div>

            {/* Mobile: simple daily progress indicator */}
            <div className="flex md:hidden items-center gap-2 ml-4">
                <div className="h-1.5 w-20 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">{Math.round(progressPercentage)}%</span>
            </div>
        </div>
    );
}
