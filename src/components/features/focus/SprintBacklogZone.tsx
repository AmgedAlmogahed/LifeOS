"use client";

import { Task } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Check, ClipboardList, Clock, ArrowRight, Play } from "lucide-react";
import { useTransition } from "react";
import { toggleTaskCurrent, updateTaskStatus } from "@/lib/actions/flow-board"; // Need updateTaskStatus

export function SprintBacklogZone({ tasks, completedTasks, projectId }: { tasks: Task[], completedTasks: Task[], projectId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleStart = (taskId: string) => {
      startTransition(async () => {
          await toggleTaskCurrent(taskId, projectId);
      });
  };

  const handleQueue = (taskId: string) => {
      startTransition(async () => {
          // Move to Queue means In Progress
          await updateTaskStatus(taskId, "In Progress"); 
      });
  };

  return (
    <div className="space-y-6">
       <div className="space-y-2">
           <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center justify-between">
               <span>Backlog ({tasks.length})</span>
           </h4>
           {tasks.length === 0 && <div className="text-sm text-muted-foreground italic">No backlog tasks.</div>}
           {tasks.map(task => (
               <div key={task.id} className="p-3 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-all group relative">
                   <div className="flex justify-between items-start mb-2">
                       <span className="text-sm font-medium line-clamp-2">{task.title}</span>
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Button size="icon" variant="ghost" className="h-6 w-6" title="Move to Queue" onClick={() => handleQueue(task.id)} disabled={isPending}>
                               <ArrowRight className="w-3.5 h-3.5" />
                           </Button>
                           <Button size="icon" variant="ghost" className="h-6 w-6 text-primary hover:bg-primary/10" title="Start Now" onClick={() => handleStart(task.id)} disabled={isPending}>
                               <Play className="w-3.5 h-3.5 ml-0.5" />
                           </Button>
                       </div>
                   </div>
                   <div className="flex items-center gap-3 text-xs text-muted-foreground">
                       {task.story_points && <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded"><ClipboardList className="w-3 h-3" /> {task.story_points}</span>}
                       {task.priority !== 'Medium' && <span className={`uppercase font-bold tracking-wider ${task.priority === 'High' ? 'text-orange-500' : 'text-muted-foreground'}`}>{task.priority}</span>}
                   </div>
               </div>
           ))}
       </div>

       <div className="space-y-2 pt-4 border-t border-border/50">
           <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center justify-between">
               <span>Completed ({completedTasks.length})</span>
               <Check className="w-3 h-3" />
           </h4>
           {completedTasks.length === 0 && <div className="text-sm text-muted-foreground italic">Get something done!</div>}
           {completedTasks.map(task => (
               <div key={task.id} className="p-2 flex items-center gap-2 text-sm text-muted-foreground bg-muted/20 rounded border border-transparent">
                   <div className="w-4 h-4 rounded-full border border-border bg-green-500/10 flex items-center justify-center text-green-500">
                       <Check className="w-2.5 h-2.5" />
                   </div>
                   <span className="line-through truncate flex-1">{task.title}</span>
               </div>
           ))}
       </div>
    </div>
  );
}
