"use client";

import { useState, useEffect, useTransition } from "react";
import { Task, FocusSession, Subtask } from "@/types/database";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock, MoreHorizontal, Plus } from "lucide-react";
import { updateTask } from "@/lib/actions/tasks";
import { addSubtask, toggleSubtask, logTime, unsetCurrentTask } from "@/lib/actions/flow-board";
import { Textarea } from "@/components/ui/textarea";

interface CurrentTaskZoneProps {
  task?: Task;
  session: FocusSession | null;
  projectId: string;
}

export function CurrentTaskZone({ task, session, projectId }: CurrentTaskZoneProps) {
  const [isPending, startTransition] = useTransition();
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [elapsed, setElapsed] = useState(0);

  // Timer effect for task duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (session && task) {
       interval = setInterval(() => {
           setElapsed(e => e + 1);
           // Every minute, sync to server? Or wait till end?
           // Syncing every minute is safe.
           if (elapsed > 0 && elapsed % 60 === 0) {
               logTime(task.id, 1); 
           }
       }, 1000);
    }
    return () => clearInterval(interval);
  }, [session, task, elapsed]);

  if (!task) {
      return (
          <div className="h-64 flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-xl bg-card/50 text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Circle className="w-8 h-8 opacity-20" />
              </div>
              <h3 className="text-lg font-medium mb-1">No Active Focus</h3>
              <p className="text-sm">Select a task from the queue to start focusing.</p>
          </div>
      );
  }

  const handleComplete = () => {
      startTransition(async () => {
          await updateTask(task.id, { status: "Done", completed_at: new Date().toISOString() });
          await unsetCurrentTask(projectId); 
      });
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newSubtaskTitle.trim()) return;
      await addSubtask(task.id, newSubtaskTitle);
      setNewSubtaskTitle("");
  };

  const subtasks = (task.subtasks as unknown as Subtask[]) || [];
  const progress = subtasks.length > 0 
      ? Math.round((subtasks.filter(s => s.completed).length / subtasks.length) * 100) 
      : 0;

  return (
    <div className="bg-card rounded-xl border border-primary/20 shadow-lg p-6 relative overflow-hidden group">
        {/* Progress Bar Background */}
        <div className="absolute top-0 left-0 h-1 bg-primary/10 w-full">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Current Focus</span>
                <h2 className="text-2xl font-bold leading-tight">{task.title}</h2>
            </div>
            
            <div className="flex items-center gap-2">
                 <div className="text-right mr-4 hidden md:block">
                     <div className="text-xs text-muted-foreground uppercase tracking-wider">Time Spent</div>
                     <div className="font-mono text-xl font-medium">
                         {Math.floor((task.time_spent_minutes || 0) + (elapsed / 60))}m
                     </div>
                 </div>
                 <Button size="sm" variant="outline" className="h-9 w-9 p-0 rounded-full" onClick={() => unsetCurrentTask(projectId)}>
                     <MoreHorizontal className="w-4 h-4" />
                 </Button>
                 <Button size="lg" className="rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/30" onClick={handleComplete} disabled={isPending}>
                     <CheckCircle2 className="w-5 h-5 mr-2" /> Complete
                 </Button>
            </div>
        </div>

        {/* Subtasks */}
        <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Subtasks ({subtasks.filter(s => s.completed).length}/{subtasks.length})</span>
                <span>{progress}%</span>
            </div>
            
            <div className="space-y-2">
                {subtasks.map((sub, idx) => (
                    <div key={sub.id || idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group/item">
                        <button 
                            onClick={() => toggleSubtask(task.id, sub.id, !sub.completed)}
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors 
                                ${sub.completed ? 'bg-primary border-primary text-primary-foreground' : 'border-input hover:border-primary'}`}
                        >
                            {sub.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                        <span className={`flex-1 text-sm ${sub.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {sub.title}
                        </span>
                    </div>
                ))}
            </div>

            <form onSubmit={handleAddSubtask} className="relative">
                <Plus className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <input 
                    type="text" 
                    placeholder="Add a subtask..." 
                    className="w-full bg-muted/30 border border-transparent rounded-lg py-2.5 pl-10 pr-4 text-sm focus:bg-background focus:border-primary focus:ring-0 transition-all outline-none"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                />
            </form>
        </div>
    </div>
  );
}
