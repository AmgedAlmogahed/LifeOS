"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/types/database";
import { Circle, AlertCircle, CheckCircle2, Pause, Lock, Bot } from "lucide-react";

import { cn, formatDate } from "@/lib/utils";

const TASK_STATUS_ICON: Record<string, React.ReactNode> = {
  Todo:        <Circle className="w-3.5 h-3.5 text-muted-foreground" />,
  "In Progress":<AlertCircle className="w-3.5 h-3.5 text-amber-500" />,
  Done:        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
  Blocked:     <Pause className="w-3.5 h-3.5 text-red-500" />,
};

interface SortableTaskCardProps {
  task: Task;
  onTaskClick: (task: Task) => void;
  disabled?: boolean;
  isLocked?: boolean;
}

export function SortableTaskCard({ task, onTaskClick, disabled, isLocked = false }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
      id: task.id,
      disabled
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "w-full glass-card p-3 flex items-center gap-3 text-left hover:border-primary/30 transition-colors group",
        isDragging ? "opacity-50 ring-2 ring-primary ring-offset-2 z-50" : "",
        disabled ? "opacity-70 cursor-not-allowed" : "cursor-grab active:cursor-grabbing",
        isLocked ? "border-amber-500/30 bg-amber-500/5" : ""
      )}
      {...attributes}
      {...listeners}
    >
      <div className="shrink-0" onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}>
          {TASK_STATUS_ICON[task.status] ?? TASK_STATUS_ICON.Todo}
      </div>
      
      <div className="flex-1 min-w-0" onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}>
          <div className="text-sm text-foreground truncate select-none">
              {task.title}
          </div>
          {task.status === "Blocked" && (task as any).block_reason && (
             <div className="mt-1 text-[10px] font-medium text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 inline-block truncate max-w-full">
                Blocked: {(task as any).block_reason}
             </div>
          )}
          {task.delegated_to && (
             <div className="mt-1 text-[10px] font-medium text-purple-500 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 inline-flex items-center gap-1">
                <Bot className="w-3 h-3" />
                Anton ({task.delegated_to})
             </div>
          )}
      </div>
      
      <div className="flex gap-2 items-center shrink-0 opacity-80 group-hover:opacity-100">
          <span className={cn(
            "text-[10px] font-medium px-2 py-0.5 rounded-md border text-center min-w-[60px]",
            task.priority === "Critical" ? "text-red-400 bg-red-500/10 border-red-500/20" :
            task.priority === "High"     ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
            task.priority === "Medium"   ? "text-primary bg-primary/10 border-primary/20" :
            "text-muted-foreground bg-accent border-border"
          )}>
            {task.priority}
          </span>
          
          {(task.story_points || 0) > 0 && (
            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded shadow-sm border border-border">
                {task.story_points} pts
            </span>
          )}
          
          {task.due_date && (
            <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border/50">
              {formatDate(task.due_date)}
            </span>
          )}
          {isLocked && (
            <span title="Waiting on prerequisite task" className="flex items-center gap-1 text-[10px] font-medium text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              <Lock className="w-2.5 h-2.5" /> Locked
            </span>
          )}
      </div>
    </div>
  );
}
