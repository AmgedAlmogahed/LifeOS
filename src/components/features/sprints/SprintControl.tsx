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
}

export function SprintControl({ project, activeSprint, tasks }: SprintControlProps) {
  const [isPending, startTransition] = useTransition();
  const [showPlanner, setShowPlanner] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const handleCompleteSprint = () => {
      setShowReview(true);
  };

  if (activeSprint) {
      return (
          <>
            <div className="flex items-center gap-4 bg-primary/5 border border-primary/20 rounded-lg p-3">
                <div className="flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">Active Sprint</span>
                    <span className="font-bold">Sprint {activeSprint.sprint_number}</span>
                </div>
                <div className="h-8 w-px bg-primary/20" />
                <div className="flex flex-col text-xs text-muted-foreground">
                    <span>Started {new Date(activeSprint.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    <span>Ends {new Date(activeSprint.planned_end_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
                <Button size="sm" variant="outline" className="ml-auto" onClick={handleCompleteSprint} disabled={isPending}>
                    {isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <CheckSquare className="w-3 h-3 mr-2" />}
                    Complete Sprint
                </Button>
                <div className="relative ml-2">
                    <Button size="icon" variant="ghost" onClick={() => {
                        if (confirm("Cancel this sprint? Tasks will be moved back to the backlog.")) {
                            startTransition(async () => {
                                const { cancelSprint } = await import("@/lib/actions/sprints");
                                await cancelSprint(activeSprint.id, project.id);
                            });
                        }
                    }}>
                        <span className="sr-only">Cancel Sprint</span>
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground hover:text-red-500"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                    </Button>
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

  return (
      <>
        <div className="flex items-center gap-4 bg-muted/30 border border-border rounded-lg p-3">
            <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">No Active Sprint</span>
                <span className="font-medium text-sm">Ready to plan next cycle</span>
            </div>
            <Button size="sm" className="ml-auto" onClick={() => setShowPlanner(true)} disabled={isPending}>
                <Plus className="w-4 h-4 mr-2" /> Plan Sprint
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
