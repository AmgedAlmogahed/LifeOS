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
                    <span>Started {new Date(activeSprint.started_at).toLocaleDateString()}</span>
                    <span>Ends {new Date(activeSprint.planned_end_at).toLocaleDateString()}</span>
                </div>
                <Button size="sm" variant="outline" className="ml-auto" onClick={handleCompleteSprint} disabled={isPending}>
                    {isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <CheckSquare className="w-3 h-3 mr-2" />}
                    Complete Sprint
                </Button>
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
