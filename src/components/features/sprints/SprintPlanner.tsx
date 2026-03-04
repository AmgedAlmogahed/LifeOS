"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Task, Project } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createSprint, createMultipleSprints } from "@/lib/actions/sprints";
import { moveTaskToSprint } from "@/lib/actions/flow-board";
import { Loader2, Layers } from "lucide-react";

interface SprintPlannerProps {
  project: Project;
  tasks: Task[];
  onClose: () => void;
}

export function SprintPlanner({ project, tasks, onClose }: SprintPlannerProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"single" | "multiple">("single");
  const [goal, setGoal] = useState("");
  const [endDate, setEndDate] = useState<string>(() => {
      const date = new Date();
      date.setDate(date.getDate() + 14); // Default 2 weeks
      return date.toISOString().split('T')[0];
  });
  
  // Bulk state
  const [sprintCount, setSprintCount] = useState(3);
  const [durationWeeks, setDurationWeeks] = useState(2);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const handleToggleTask = (taskId: string) => {
      const next = new Set(selectedTaskIds);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      setSelectedTaskIds(next);
  };

  const handlePlanSprint = () => {
      if (mode === "single") {
          if (!goal.trim()) {
              alert("Please set a sprint goal.");
              return;
          }
          if (!endDate) {
              alert("Please set an end date for the sprint.");
              return;
          }
          if (selectedTaskIds.size === 0) {
              if (!confirm("Plan sprint with no tasks?")) return;
          }

          startTransition(async () => {
              // 1. Create Sprint
              const result = await createSprint(project.id, {
                  goal,
                  planned_end_at: new Date(endDate).toISOString(),
                  status: "planning",
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
      } else {
          // Multiple Mode
          startTransition(async () => {
              const result = await createMultipleSprints(project.id, sprintCount, durationWeeks, startDate);
              if (result.error) {
                  alert("Error creating sprints: " + result.error);
                  return;
              }
              router.refresh();
              onClose();
          });
      }
  };

  const totalPoints = tasks
    .filter(t => selectedTaskIds.has(t.id))
    .reduce((sum, t) => sum + (t.story_points || 0), 0);
  
  const CAPACITY_WARNING = 30; // Simple heuristic for now

  return (
    <div className="flex flex-col h-full gap-6 p-1">
        {/* Mode Toggle */}
        <div className="flex p-1 bg-muted/50 rounded-lg shrink-0">
            <button
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === "single" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setMode("single")}
            >
                Plan Single Phase
            </button>
            <button
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors flex justify-center items-center gap-2 ${mode === "multiple" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setMode("multiple")}
            >
                <Layers className="w-4 h-4" /> Bulk Generate Phases
            </button>
        </div>

        {mode === "single" ? (
            <>
                <div className="space-y-4 border-b pb-6 shrink-0">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium leading-none">Sprint Goal</label>
                        <Textarea 
                            placeholder="What is the main focus of this sprint?" 
                            value={goal}
                            onChange={e => setGoal(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium leading-none">Target End Date</label>
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
            </>
        ) : (
            <div className="space-y-6 flex-1 pt-4">
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg flex items-start gap-3">
                    <Layers className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div className="text-sm text-foreground">
                        <p className="font-semibold mb-1">Bulk Phase Generation</p>
                        <p className="text-muted-foreground">Create multiple sequential empty sprints. You can populate them with tasks using the drag-and-drop roadmap later.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium leading-none">Number of Phases</label>
                        <Input 
                            type="number" 
                            min="1" max="20"
                            value={sprintCount}
                            onChange={e => setSprintCount(Number(e.target.value))}
                        />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium leading-none">Duration (Weeks)</label>
                        <Input 
                            type="number" 
                            min="1" max="52"
                            value={durationWeeks}
                            onChange={e => setDurationWeeks(Number(e.target.value))}
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                    <label className="text-sm font-medium leading-none">Start Date (First Phase)</label>
                    <Input 
                        type="date" 
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                    />
                </div>
            </div>
        )}

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-border">
              <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
              <Button onClick={handlePlanSprint} disabled={isPending}>
                  {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Planned Phase
              </Button>
          </div>
    </div>
  );
}
