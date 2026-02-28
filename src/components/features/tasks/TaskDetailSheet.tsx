"use client";

import { useState, useTransition } from "react";
import { Task, Subtask } from "@/types/database";
import type { ScopeNode } from "@/lib/actions/scope-nodes";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2, Circle, AlertCircle, SkipForward, Trash2, CalendarClock,
  Clock, Plus, Bot,
} from "lucide-react";
import { updateTask, deleteTask } from "@/lib/actions/tasks";
import { addSubtask, toggleSubtask, skipTask, updateTaskStatus } from "@/lib/actions/flow-board";
import { formatDistanceToNow, isPast } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName?: string;
  scopeNodes?: ScopeNode[];
}

const statusOptions = ["Todo", "In Progress", "Done", "Blocked"] as const;
const priorityOptions = ["Critical", "High", "Medium", "Low"] as const;

const statusColors: Record<string, string> = {
  "Todo": "bg-muted text-muted-foreground",
  "In Progress": "bg-blue-500/10 text-blue-500",
  "Done": "bg-green-500/10 text-green-500",
  "Blocked": "bg-red-500/10 text-red-500",
};

const priorityColors: Record<string, string> = {
  "Critical": "bg-red-500/10 text-red-500",
  "High": "bg-amber-500/10 text-amber-500",
  "Medium": "bg-blue-500/10 text-blue-500",
  "Low": "bg-muted text-muted-foreground",
};

export function TaskDetailSheet({ task, open, onOpenChange, projectName, scopeNodes }: TaskDetailSheetProps) {
  const [isPending, startTransition] = useTransition();
  const [editTitle, setEditTitle] = useState("");
  const [titleEditing, setTitleEditing] = useState(false);
  const [description, setDescription] = useState("");
  const [descEditing, setDescEditing] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [showBlockInput, setShowBlockInput] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();

  if (!task) return null;

  const subtasks = (task.subtasks as unknown as Subtask[]) || [];
  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const subtaskProgress = subtasks.length > 0
    ? Math.round((completedSubtasks / subtasks.length) * 100)
    : 0;

  const metadata = (task.metadata as Record<string, unknown>) || {};

  const handleTitleBlur = () => {
    setTitleEditing(false);
    if (editTitle.trim() && editTitle.trim() !== task.title) {
      startTransition(async () => {
        await updateTask(task.id, { title: editTitle.trim() });
        router.refresh();
        toast.success("Title updated");
      });
    }
  };

  const handleDescriptionBlur = () => {
    setDescEditing(false);
    const currentDesc = (metadata.description as string) || "";
    if (description !== currentDesc) {
      startTransition(async () => {
        await updateTask(task.id, {
          metadata: { ...metadata, description } as any,
        });
        router.refresh();
      });
    }
  };

  const handleStatusChange = (status: string) => {
    startTransition(async () => {
      await updateTaskStatus(task.id, status as any);
      router.refresh();
      toast.success(`Status → ${status}`);
    });
  };

  const handlePriorityChange = (priority: string) => {
    startTransition(async () => {
      await updateTask(task.id, { priority: priority as any });
      router.refresh();
      toast.success(`Priority → ${priority}`);
    });
  };

  const handleDueDateChange = (date: string) => {
    startTransition(async () => {
      await updateTask(task.id, { due_date: date || null });
      router.refresh();
    });
  };

  const handleComplete = () => {
    startTransition(async () => {
      await updateTask(task.id, { status: "Done", completed_at: new Date().toISOString() });
      router.refresh();
      toast.success("Task completed!");
      onOpenChange(false);
    });
  };

  const handleBlock = () => {
    if (!blockReason.trim()) return;
    startTransition(async () => {
      await updateTask(task.id, {
        status: "Blocked",
        // Persist the block reason to the database column
        block_reason: blockReason.trim(),
      } as any);
      router.refresh();
      toast.info("Task blocked");
      setShowBlockInput(false);
      setBlockReason("");
    });
  };

  const handleSkip = () => {
    startTransition(async () => {
      await skipTask(task.id);
      router.refresh();
      toast.info("Task skipped");
      onOpenChange(false);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteTask(task.id);
      router.refresh();
      toast.success("Task deleted");
      onOpenChange(false);
    });
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    await addSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle("");
    router.refresh();
  };

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    await toggleSubtask(task.id, subtaskId, completed);
    router.refresh();
  };

  const handleDelegate = () => {
    startTransition(async () => {
      await updateTask(task.id, {
        delegated_to: "openclaw",
        delegation_status: "pending",
      } as any);
      router.refresh();
      toast.success("Delegated to OpenClaw");
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-2">
          {/* Editable Title */}
          {titleEditing ? (
            <input
              autoFocus
              className="text-lg font-semibold bg-transparent border-b border-primary outline-none w-full pb-1"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => e.key === "Enter" && handleTitleBlur()}
            />
          ) : (
            <SheetTitle
              className="cursor-pointer hover:text-primary transition-colors text-left"
              onClick={() => {
                setEditTitle(task.title);
                setTitleEditing(true);
              }}
            >
              {task.title}
            </SheetTitle>
          )}

          {/* Status + Priority badges */}
          <div className="flex items-center gap-2 pt-2">
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded cursor-pointer border-none outline-none",
                statusColors[task.status] || ""
              )}
            >
              {statusOptions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={task.priority}
              onChange={(e) => handlePriorityChange(e.target.value)}
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded cursor-pointer border-none outline-none",
                priorityColors[task.priority] || ""
              )}
            >
              {priorityOptions.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-4">
          {/* Scope node assignment */}
          {scopeNodes && scopeNodes.length > 0 && (
            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs text-muted-foreground shrink-0">Scope:</span>
              <select
                value={(task as any).scope_node_id ?? ""}
                onChange={(e) => {
                  const val = e.target.value || null;
                  startTransition(async () => {
                    await updateTask(task.id, { scope_node_id: val } as any);
                    router.refresh();
                  });
                }}
                className="flex-1 bg-muted/30 border border-border rounded px-2 py-1 text-xs outline-none focus:border-primary"
              >
                <option value="">— No scope —</option>
                {scopeNodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.node_type === "portal" || n.node_type === "Portal" ? "" : n.node_type === "module" || n.node_type === "Module" ? "  " : "    "}
                    {n.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {projectName && (
              <span className="bg-muted px-2 py-1 rounded">{projectName}</span>
            )}
            {!projectName && !task.project_id && (
              <span className="bg-muted px-2 py-1 rounded">Personal</span>
            )}
            {task.story_points && (
              <span className="bg-muted px-2 py-1 rounded">{task.story_points} pts</span>
            )}
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Due Date</label>
            <input
              type="date"
              value={task.due_date || ""}
              onChange={(e) => handleDueDateChange(e.target.value)}
              className="block w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
            />
            {task.due_date && (
              <span className={cn(
                "text-xs flex items-center gap-1",
                isPast(new Date(task.due_date)) && task.status !== "Done" ? "text-red-500" : "text-muted-foreground"
              )}>
                <CalendarClock className="w-3 h-3" />
                {isPast(new Date(task.due_date)) && task.status !== "Done"
                  ? `Overdue ${formatDistanceToNow(new Date(task.due_date))}`
                  : `Due ${formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}`
                }
              </span>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
            {descEditing ? (
              <Textarea
                autoFocus
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                placeholder="Add a description..."
                className="min-h-[80px] resize-none"
              />
            ) : (
              <div
                className="min-h-[60px] p-3 bg-muted/20 rounded-lg text-sm cursor-pointer hover:bg-muted/30 transition-colors whitespace-pre-wrap"
                onClick={() => {
                  setDescription((metadata.description as string) || "");
                  setDescEditing(true);
                }}
              >
                {(metadata.description as string) || (
                  <span className="text-muted-foreground/50 italic">Click to add description...</span>
                )}
              </div>
            )}
          </div>

          {/* Subtasks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Subtasks
              </label>
              <span className="text-xs text-muted-foreground">
                {completedSubtasks} of {subtasks.length} complete
              </span>
            </div>

            {subtasks.length > 0 && (
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${subtaskProgress}%` }}
                />
              </div>
            )}

            <div className="space-y-1">
              {subtasks.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/30 transition-colors">
                  <button
                    onClick={() => handleToggleSubtask(sub.id, !sub.completed)}
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0",
                      sub.completed
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-input hover:border-primary"
                    )}
                  >
                    {sub.completed && <CheckCircle2 className="w-3 h-3" />}
                  </button>
                  <span className={cn(
                    "text-sm flex-1",
                    sub.completed && "line-through text-muted-foreground"
                  )}>
                    {sub.title}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddSubtask} className="relative">
              <Plus className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Add subtask..."
                className="w-full bg-muted/20 border border-transparent rounded-lg py-2 pl-8 pr-3 text-sm focus:bg-background focus:border-primary outline-none transition-all"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
              />
            </form>
          </div>

          {/* Delegation */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Delegation</label>
            {task.delegated_to ? (
              <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg">
                <Bot className="w-4 h-4 text-primary" />
                <div className="flex-1">
                  <span className="text-sm font-medium">{task.delegated_to}</span>
                  <span className={cn(
                    "ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                    task.delegation_status === "completed" ? "bg-green-500/10 text-green-500" :
                    task.delegation_status === "in_progress" ? "bg-blue-500/10 text-blue-500" :
                    "bg-amber-500/10 text-amber-500"
                  )}>
                    {task.delegation_status}
                  </span>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-primary"
                onClick={handleDelegate}
                disabled={isPending}
              >
                <Bot className="w-4 h-4 mr-2" />
                Delegate to OpenClaw
              </Button>
            )}
          </div>

          {/* Time Tracking */}
          {(task.time_spent_minutes ?? 0) > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>
                {Math.floor((task.time_spent_minutes || 0) / 60)}h {(task.time_spent_minutes || 0) % 60}m logged
              </span>
            </div>
          )}
        </div>

        <SheetFooter className="border-t border-border">
          <div className="flex items-center gap-2 w-full flex-wrap">
            {task.status !== "Done" && (
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleComplete} disabled={isPending}>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Complete
              </Button>
            )}

            {!showBlockInput && task.status !== "Blocked" && (
              <Button size="sm" variant="outline" className="text-amber-500 hover:text-amber-600" onClick={() => setShowBlockInput(true)} disabled={isPending}>
                <AlertCircle className="w-3.5 h-3.5 mr-1" /> Block
              </Button>
            )}

            {showBlockInput && (
              <div className="flex items-center gap-1 flex-1">
                <input
                  autoFocus
                  placeholder="Block reason..."
                  className="flex-1 bg-muted/30 border border-border rounded px-2 py-1 text-sm outline-none focus:border-amber-500"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleBlock()}
                />
                <Button size="sm" variant="outline" onClick={handleBlock} disabled={!blockReason.trim() || isPending}>
                  Confirm
                </Button>
              </div>
            )}

            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={handleSkip} disabled={isPending}>
              <SkipForward className="w-3.5 h-3.5 mr-1" /> Skip
            </Button>

            <div className="ml-auto">
              {!showDeleteConfirm ? (
                <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-500" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-red-500">Delete?</span>
                  <Button size="sm" variant="ghost" onClick={() => setShowDeleteConfirm(false)}>No</Button>
                  <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isPending}>Yes</Button>
                </div>
              )}
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
