"use client";

import { useTransition, useState } from "react";
import { Sprint, Project, Task } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Play, CheckSquare, Plus, Loader2 } from "lucide-react";
import { completeSprint, startSprint } from "@/lib/actions/sprints";
import { SprintPlanner } from "./SprintPlanner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SprintReview } from "./SprintReview";

interface SprintControlProps {
  project: Project;
  activeSprint: Sprint | null;
  tasks: Task[]; // Backlog tasks
  onStartRequest?: () => void;
  compact?: boolean;
}

export function SprintControl({ project, activeSprint, tasks, onStartRequest, compact }: SprintControlProps) {
  const [isPending, startTransition] = useTransition();
  const [showPlanner, setShowPlanner] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const handleCompleteSprint = () => setShowReview(true);

  const handleStartSprint = () => {
      if (onStartRequest) {
          onStartRequest();
          return;
      }
      startTransition(async () => {
          const { startSprint: startSprintAction } = await import("@/lib/actions/sprints");
          const res = await startSprintAction(activeSprint!.id, project.id);
          if (res?.error) {
              alert(res.error); // Basic error handling for constraint violation
          }
      });
  };

  const handleCancelSprint = () => {
      if (confirm("Cancel this sprint? Tasks will be moved back to the backlog.")) {
          startTransition(async () => {
              const { cancelSprint } = await import("@/lib/actions/sprints");
              await cancelSprint(activeSprint!.id, project.id);
          });
      }
  };

  // ── No Sprint (Plan New) State ──
  if (!activeSprint) {
      return (
          <>
            <div className="flex items-center gap-4 bg-muted/30 border border-border px-4 py-8 rounded-lg justify-center w-full border-dashed">
                <Button onClick={() => setShowPlanner(true)} disabled={isPending} variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                    <Plus className="w-4 h-4 mr-2" /> Plan Next Sprint Phase
                </Button>
            </div>
            <Dialog open={showPlanner} onOpenChange={setShowPlanner}>
                <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Sprint Planning</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden">
                        <SprintPlanner project={project} tasks={tasks} onClose={() => setShowPlanner(false)} />
                    </div>
                </DialogContent>
            </Dialog>
          </>
      );
  }

  // ── Completed State ──
  if (activeSprint.status === "completed") {
      return (
          <div className="flex items-center gap-4 bg-muted/10 border border-border/50 rounded-lg p-3 opacity-70">
              <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Completed</span>
                  <span className="font-bold text-muted-foreground line-through">Sprint {activeSprint.sprint_number}</span>
              </div>
              <div className="h-8 w-px bg-border group-hover:bg-border/50" />
              <div className="flex flex-col text-xs text-muted-foreground">
                  <span>{activeSprint.completed_points || 0} pts delivered</span>
                  <span>{activeSprint.completed_task_count || 0} tasks finished</span>
              </div>
              <div className="ml-auto flex flex-col text-xs text-right text-muted-foreground">
                  <span>Closed {new Date(activeSprint.ended_at || activeSprint.planned_end_at).toLocaleDateString()}</span>
              </div>
          </div>
      );
  }

  // ── Planning (Queued) State ──
  if (activeSprint.status === "planning") {
      return (
          <div className="flex items-center gap-4 bg-card/50 border border-border border-dashed rounded-lg p-3">
              <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Planned Phase</span>
                  <span className="font-bold">Sprint {activeSprint.sprint_number}</span>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="flex flex-col text-xs text-muted-foreground">
                  <span>Target End: {new Date(activeSprint.planned_end_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  <span className="truncate max-w-[200px]" title={activeSprint.goal}>{activeSprint.goal || "No goal set"}</span>
              </div>
              
              <div className="ml-auto flex items-center gap-2">
                  <Button size="sm" onClick={handleStartSprint} disabled={isPending}>
                      {isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Play className="w-3 h-3 mr-2" />}
                      Start Sprint
                  </Button>
                  <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-red-500" onClick={handleCancelSprint} disabled={isPending}>
                      <span className="sr-only">Cancel Sprint</span>
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                  </Button>
              </div>
          </div>
      );
  }

  // ── Active State ──
  return (
      <>
        <div className="flex items-center gap-4 bg-primary/5 border border-primary/20 rounded-lg p-3 shadow-sm ring-1 ring-primary/10">
            <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    Active Phase
                </span>
                <span className="font-bold text-base">Sprint {activeSprint.sprint_number}</span>
            </div>
            <div className="h-8 w-px bg-primary/20" />
            <div className="flex flex-col text-xs text-muted-foreground">
                <span>Started {new Date(activeSprint.started_at!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                <span className="font-medium text-foreground">Ends {new Date(activeSprint.planned_end_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
            
            <div className="ml-auto flex items-center gap-2">
                <Button size="sm" variant="default" className="shadow bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleCompleteSprint} disabled={isPending}>
                    {isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <CheckSquare className="w-4 h-4 mr-2" />}
                    Complete Sprint
                </Button>
                <div className="relative">
                    <Button size="icon" variant="ghost" onClick={handleCancelSprint} disabled={isPending}>
                        <span className="sr-only">Cancel Sprint</span>
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground hover:text-red-500 transition-colors"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                    </Button>
                </div>
            </div>
        </div>

        <SprintReview 
            sprint={activeSprint}
            tasks={tasks.filter(t => t.sprint_id === activeSprint.id)}
            open={showReview}
            onOpenChange={setShowReview}
        />
      </>
  );
}
