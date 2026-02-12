"use client";

import { useMemo } from "react";
import { Task } from "@/types/database";
import { cn } from "@/lib/utils";
import { CheckCircle2, Target } from "lucide-react";

interface DoneRibbonProps {
    completedTasks: Task[];
    dailyGoal?: number; // Optional daily task goal, e.g. 3-5
}

export function DoneRibbon({ completedTasks, dailyGoal = 5 }: DoneRibbonProps) {
    // Filter for tasks completed TODAY
    const todayCompleted = useMemo(() => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        return completedTasks.filter(t => {
            if (!t.updated_at) return false; // assuming updated_at is roughly completion time for Done tasks
            // Ideally we'd have text 'completed_at' but updated_at is a decent proxy for now if status changed to Done
            const completionDate = new Date(t.updated_at);
            return completionDate >= startOfDay;
        });
    }, [completedTasks]);

    const count = todayCompleted.length;
    const points = todayCompleted.reduce((sum, t) => sum + (t.story_points || 0), 0);
    
    const progressPercentage = Math.min((count / dailyGoal) * 100, 100);

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border z-40 h-12 flex items-center px-6 justify-between shadow-lg">
            <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle2 className={cn("w-5 h-5", count > 0 ? "text-green-500" : "text-muted-foreground")} />
                    <span className="text-foreground">{count}</span>
                    <span className="text-muted-foreground">tasks today</span>
                 </div>
                 
                 <div className="h-4 w-[1px] bg-border" />
                 
                 <div className="flex items-center gap-2 text-sm font-medium">
                    <Target className={cn("w-5 h-5", points > 0 ? "text-blue-500" : "text-muted-foreground")} />
                    <span className="text-foreground">{points}</span>
                    <span className="text-muted-foreground">points</span>
                 </div>
            </div>

            {/* Daily Progress Bar */}
            <div className="flex items-center gap-3 w-1/3 max-w-sm">
                <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Daily Goal</span>
                <div className="h-2 flex-1 full bg-secondary rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
                <span className="text-xs font-mono text-muted-foreground">{Math.round(progressPercentage)}%</span>
            </div>
        </div>
    );
}
