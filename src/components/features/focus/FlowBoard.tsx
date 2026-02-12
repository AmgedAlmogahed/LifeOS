"use client";

import { useState, useTransition } from "react";
import { Task, Project, Sprint, FocusSession } from "@/types/database";
import { format } from "date-fns";
import { CurrentTaskZone } from "./CurrentTaskZone";
import { TodayQueueZone } from "./TodayQueueZone";
import { SprintBacklogZone } from "./SprintBacklogZone";
import { Button } from "@/components/ui/button";
import { Play, Pause, FastForward } from "lucide-react";
import { createFocusSession, endFocusSession } from "@/lib/actions/focus-sessions";

interface FlowBoardProps {
  project: Project;
  activeSprint: Sprint | null;
  tasks: Task[];
  initialSession: FocusSession | null;
}

export function FlowBoard({ project, activeSprint, tasks, initialSession }: FlowBoardProps) {
  const [session, setSession] = useState<FocusSession | null>(initialSession);
  const [isPending, startTransition] = useTransition();

  // Tasks Logic
  // 1. Current Task: is_current = true
  // 2. Queue: is_current = false, status = 'In Progress' OR due <= Today (if no sprint) OR manual priority.
  //    For simplicity: Queue = In Progress tasks + Top 5 Todo tasks in current sprint.
  // 3. Board: Rest of tasks in sprint (or backlog if no sprint).

  // Filter tasks belonging to current active sprint (or backlog if no sprint)
  // But wait, "Backlog" is usually separate.
  // Flow Board is typically for *Active* work.
  // If no sprint, show all non-completed tasks?
  
  const sprintTasks = activeSprint 
      ? tasks.filter(t => t.sprint_id === activeSprint.id)
      : tasks.filter(t => !t.sprint_id && t.status !== 'Done');

  const currentTask = sprintTasks.find(t => t.is_current);
  
  // Queue: In Progress (not current) + Next Up (Todo)
  const queueTasks = sprintTasks
      .filter(t => !t.is_current && t.status !== 'Done' && (t.status === 'In Progress' || t.priority === 'Critical' || t.priority === 'High'))
      .sort((a, b) => {
          // Sort by In Progress first, then Priority
          if (a.status === 'In Progress' && b.status !== 'In Progress') return -1;
          if (b.status === 'In Progress' && a.status !== 'In Progress') return 1;
          // Priority sort (Custom logic needed as priority is Enum string)
          return 0; 
      });

  const backlogTasks = sprintTasks
      .filter(t => !t.is_current && t.status === 'Todo' && !queueTasks.includes(t))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const completedTasks = sprintTasks.filter(t => t.status === 'Done');

  // Session Controls
  const handleToggleSession = () => {
      startTransition(async () => {
          if (session) {
              await endFocusSession(session.id, ""); // Simple end, notes usually in modal
              setSession(null);
          } else {
              const newSession = await createFocusSession(project.id);
              if (newSession) setSession(newSession);
          }
      });
  };

  return (
    <div className="h-full flex flex-col gap-6 p-6 bg-background text-foreground">
      {/* Header / Session Control */}
      <div className="flex items-center justify-between">
          <div>
              <h1 className="text-2xl font-bold tracking-tight mb-1">{project.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{activeSprint ? `Sprint ${activeSprint.sprint_number}` : "No Active Sprint"}</span>
                  {activeSprint && <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">Active</span>}
              </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="text-right">
                 <div className="text-sm font-medium">{session ? "Focus Mode" : "Ready"}</div>
                 {session && <div className="text-xs text-green-500 animate-pulse">Session Active</div>}
             </div>
             <Button 
                size="icon" 
                variant={session ? "destructive" : "default"} 
                className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all"
                onClick={handleToggleSession}
                disabled={isPending}
             >
                 {session ? <Pause className="fill-current" /> : <Play className="fill-current ml-1" />}
             </Button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[600px]">
          {/* Zone 1: Current Task (Main Focus) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
              <CurrentTaskZone task={currentTask} session={session} projectId={project.id} />
              
              {/* Zone 2: Today's Queue (Horizontal list below current?) or Vertical? */}
              {/* Spec view design implies usually Current is large. Queue is secondary. */}
              <div className="flex-1 min-h-0 bg-secondary/5 rounded-xl p-4 border border-border/50">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
                    <span>Next Up</span>
                    <span className="text-xs bg-background px-2 py-0.5 rounded border border-border">{queueTasks.length}</span>
                  </h3>
                  <TodayQueueZone tasks={queueTasks} projectId={project.id} />
              </div>
          </div>

          {/* Zone 3: The Board (Sprint Backlog & Completed) */}
          <div className="lg:col-span-5 bg-card rounded-xl border border-border shadow-sm flex flex-col h-full overflow-hidden">
             <div className="p-4 border-b border-border bg-muted/30">
                 <h3 className="font-semibold">Sprint Board</h3>
             </div>
             <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                 <SprintBacklogZone tasks={backlogTasks} completedTasks={completedTasks} projectId={project.id} />
             </div>
          </div>
      </div>
    </div>
  );
}
