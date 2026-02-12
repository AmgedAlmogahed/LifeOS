"use client";

import { Task } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { toggleTaskCurrent } from "@/lib/actions/flow-board";
import { useTransition } from "react";

export function TodayQueueZone({ tasks, projectId }: { tasks: Task[], projectId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleStart = (taskId: string) => {
      startTransition(async () => {
          await toggleTaskCurrent(taskId, projectId);
      });
  };

  return (
    <div className="space-y-2">
      {tasks.length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground bg-muted/20 border border-dashed rounded-lg">
             Queue is empty. Add tasks from the board.
          </div>
      )}
      {tasks.map(task => (
        <div key={task.id} className="group relative flex items-center justify-between p-3 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer">
            <div className="flex-1 min-w-0 pr-4">
               <div className="flex items-center gap-2 mb-1">
                   <span className={`w-2 h-2 rounded-full ${task.status === 'In Progress' ? 'bg-primary animate-pulse' : 'bg-secondary'}`} />
                   <span className="text-sm font-medium truncate">{task.title}</span>
               </div>
               <div className="flex items-center gap-3 text-xs text-muted-foreground">
                   {task.due_date && <span>Due {new Date(task.due_date).toLocaleDateString()}</span>}
                   {task.priority !== 'Medium' && <span className={`px-1.5 py-0.5 rounded uppercase tracking-wider font-bold ${
                       task.priority === 'High' ? 'bg-red-500/10 text-red-500' : 'bg-gray-500/10 text-gray-500'
                   }`}>{task.priority}</span>}
               </div>
            </div>
            
            <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-primary/10 hover:text-primary" onClick={() => handleStart(task.id)} disabled={isPending}>
                <Play className="w-4 h-4 fill-current ml-0.5" />
            </Button>
        </div>
      ))}
    </div>
  );
}
