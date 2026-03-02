"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Task, Project } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createSprint } from "@/lib/actions/sprints";
import { moveTaskToSprint } from "@/lib/actions/flow-board";
import { Loader2 } from "lucide-react";

interface SprintPlannerProps {
  project: Project;
  tasks: Task[];
  onClose: () => void;
}

export function SprintPlanner({ project, tasks, onClose }: SprintPlannerProps) {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [endDate, setEndDate] = useState<string>(() => {
      const date = new Date();
      date.setDate(date.getDate() + 14); // Default 2 weeks
      return date.toISOString().split('T')[0];
  });
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const handleToggleTask = (taskId: string) => {
      const next = new Set(selectedTaskIds);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      setSelectedTaskIds(next);
  };

  const handleStartSprint = () => {
      if (!goal.trim()) {
          alert("Please set a sprint goal.");
          return;
      }
      if (!endDate) {
          alert("Please set an end date for the sprint.");
          return;
      }
      if (selectedTaskIds.size === 0) {
          if (!confirm("Start sprint with no tasks?")) return;
      }

      startTransition(async () => {
          // 1. Create Sprint
          const result = await createSprint(project.id, {
              goal,
              planned_end_at: new Date(endDate).toISOString(),
              status: "active",
              started_at: new Date().toISOString()
          });

          if (result.error || !result.data) {
              alert("Error creating sprint: " + result.error);
              return;
          }

          const sprintId = result.data.id;

          // 2. Assign Tasks
          await Promise.all(
              Array.from(selectedTaskIds).map(taskId => moveTaskToSprint(taskId, sprintId, project.id))
          );

          router.refresh();
          onClose();
      });
  };

  const totalPoints = tasks
    .filter(t => selectedTaskIds.has(t.id))
    .reduce((sum, t) => sum + (t.story_points || 0), 0);
  
  const CAPACITY_WARNING = 30; // Simple heuristic for now

  return (
    <div className="flex flex-col h-full gap-6 p-1">
        <div className="space-y-4 border-b pb-6">
            <div className="grid gap-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Sprint Goal</label>
                <Textarea 
                    placeholder="What is the main focus of this sprint?" 
                    value={goal}
                    onChange={e => setGoal(e.target.value)}
                />
            </div>
            <div className="grid gap-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Target End Date</label>
                <div className="flex items-center gap-2">
                    <Input 
                        type="date" 
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-40"
                    />
                    <div className="flex items-center gap-1 text-xs">
                        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => {
                            const d = new Date(); d.setDate(d.getDate() + 7); setEndDate(d.toISOString().split('T')[0]);
                        }}>+1w</Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => {
                            const d = new Date(); d.setDate(d.getDate() + 14); setEndDate(d.toISOString().split('T')[0]);
                        }}>+2w</Button>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Select Tasks</h3>
                <div className={`text-xs font-bold px-2 py-1 rounded border ${totalPoints > CAPACITY_WARNING ? 'bg-amber-500/10 text-amber-600 border-amber-200' : 'bg-muted text-foreground border-transparent'}`}>
                    Commitment: {totalPoints} pts
                    {totalPoints > CAPACITY_WARNING && <span className="ml-1">⚠️ High</span>}
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto border rounded-lg bg-card/50 p-2 space-y-1">
                {tasks.filter(t => t.status !== "Done").length === 0 && <div className="p-4 text-center text-muted-foreground italic">No open tasks to add.</div>}
                
                {tasks.filter(t => t.status !== "Done").map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer" onClick={() => handleToggleTask(task.id)}>
                        <input 
                            type="checkbox"
                            checked={selectedTaskIds.has(task.id)}
                            onChange={() => handleToggleTask(task.id)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{task.title}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <span className={task.priority === 'High' ? 'text-orange-500' : ''}>{task.priority}</span>
                                {task.story_points && <span>{task.story_points} pts</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="pt-4 flex justify-end gap-2 shrink-0">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleStartSprint} disabled={isPending}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Plan & Start Sprint
            </Button>
        </div>
    </div>
  );
}
