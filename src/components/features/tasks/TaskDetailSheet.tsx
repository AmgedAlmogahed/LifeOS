"use client";

import { useState, useTransition, useEffect } from "react";
import { Task, Subtask } from "@/types/database";
import type { ScopeNode } from "@/lib/actions/scope-nodes";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2, Circle, AlertCircle, SkipForward, Trash2, CalendarClock,
  Clock, Plus, Bot, FastForward, Lock, Search
} from "lucide-react";
import { updateTask, deleteTask } from "@/lib/actions/tasks";
import { addSubtask, toggleSubtask, skipTask, updateTaskStatus, fetchLastSessionNotes } from "@/lib/actions/flow-board";
import { getTaskDependencies, addTaskDependency, TaskDependency } from "@/lib/actions/task-dependencies";
import { format, formatDistanceToNow, isPast, isValid } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DelegateModal } from "./DelegateModal";

interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName?: string;
  scopeNodes?: ScopeNode[];
  allTasks?: Task[];
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

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  projectName,
  scopeNodes,
  allTasks,
}: TaskDetailSheetProps) {
  const [isPending, startTransition] = useTransition();
  const [editTitle, setEditTitle] = useState("");
  const [titleEditing, setTitleEditing] = useState(false);
  const [description, setDescription] = useState("");
  const [descEditing, setDescEditing] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [showBlockInput, setShowBlockInput] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [lastSessionNotes, setLastSessionNotes] = useState<string | null>(null);
  
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [depSelect, setDepSelect] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [isDelegateModalOpen, setIsDelegateModalOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (task?.id) {
      fetchLastSessionNotes(task.id).then(notes => {
        setLastSessionNotes(notes);
      });
      getTaskDependencies(task.id).then(setDependencies);
    }
  }, [task?.id]);

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

  const handleStartDateChange = (date: Date | undefined) => {
    startTransition(async () => {
      await updateTask(task.id, { start_date: date ? date.toISOString() : null } as any);
      router.refresh();
    });
  };

  const handleDueDateChange = (date: Date | undefined) => {
    startTransition(async () => {
      await updateTask(task.id, { due_date: date ? date.toISOString() : null });
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
      // Optimistic UI updates
      setShowBlockInput(false);
      
      await updateTask(task.id, {
        status: "Blocked",
        block_reason: blockReason.trim(),
      } as any);
      
      // Update local task state reference for immediate visual feedback before server refresh
      (task as any).block_reason = blockReason.trim();
      task.status = "Blocked";
      
      router.refresh();
      toast.info("Task blocked");
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
    setIsDelegateModalOpen(true);
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
            {task.delegated_to && (
              <span className="flex items-center gap-1 text-[10px] bg-purple-500/10 text-purple-500 font-bold uppercase tracking-wider px-2 py-1 rounded">
                <Bot className="w-3 h-3" />
                {task.delegated_to}
              </span>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-4">
          
          {/* Visual Blocking Banner */}
          {(() => {
            const unfinishedDeps = dependencies.map(d => allTasks?.find(t => t.id === d.depends_on_task_id)).filter(t => t && t.status !== "Done") as Task[];
            if (unfinishedDeps.length === 0) return null;
            return (
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex items-start gap-2 mt-4">
                <Lock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="text-sm text-foreground/90">
                  <span className="font-semibold text-amber-500">Locked:</span> Waiting on {unfinishedDeps.map(t => `"${t.title}"`).join(", ")} to complete.
                </div>
              </div>
            );
          })()}

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

          {/* Last Session / Resume Snippet */}
          {lastSessionNotes && (
            <div className="mt-4 p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-widest">
                <FastForward className="w-3.5 h-3.5" />
                Resume Context
              </div>
              <p className="text-sm text-foreground/80 italic leading-relaxed whitespace-pre-wrap line-clamp-3">
                "{lastSessionNotes}"
              </p>
            </div>
          )}

          {/* ────────────────── EXECUTION SECTION ────────────────── */}
          <div className="pt-2 border-t border-border mt-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-4">Execution</h4>
            
            {/* Description */}
            <div className="space-y-1.5 mb-6">
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
                  {(metadata.description as string) || <span className="text-muted-foreground italic">Click to add description...</span>}
                </div>
              )}
            </div>

            {/* Subtasks (Checklist) */}
            <div className="space-y-3 mb-6">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Checklist</span>
                <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full">{completedSubtasks}/{subtasks.length}</span>
              </label>

              {/* Progress bar */}
              {subtasks.length > 0 && (
                <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary h-full transition-all duration-300" style={{ width: `${subtaskProgress}%` }} />
                </div>
              )}

              {/* List */}
              <div className="space-y-1.5">
                {subtasks.map((st) => (
                  <div key={st.id} className="flex items-start gap-2 group hover:bg-muted/10 p-1.5 rounded-md transition-colors">
                    <button
                      onClick={() => handleToggleSubtask(st.id, !st.completed)}
                      className={cn("mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors", st.completed && "text-primary")}
                    >
                      {st.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4 cursor-pointer" />}
                    </button>
                    <span className={cn("text-sm", st.completed && "line-through text-muted-foreground/60")}>
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add New Input */}
              <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Add item..."
                  className="flex-1 bg-muted/20 border border-transparent hover:border-border focus:border-primary focus:bg-background rounded-md px-3 py-1.5 text-sm outline-none transition-all"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  disabled={isPending}
                />
                {newSubtaskTitle.trim() && (
                  <Button type="submit" size="sm" variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </form>
            </div>

            {/* Dates (Start & Due) */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-muted/30 border-border text-sm h-9",
                        !(task as any).start_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarClock className="mr-2 h-4 w-4" />
                      {(task as any).start_date && isValid(new Date((task as any).start_date)) && new Date((task as any).start_date).getFullYear() > 1900 ? (
                        format(new Date((task as any).start_date), "MMM d, yyyy")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={(task as any).start_date && isValid(new Date((task as any).start_date)) && new Date((task as any).start_date).getFullYear() > 1900 ? new Date((task as any).start_date) : undefined}
                      onSelect={handleStartDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-muted/30 border-border text-sm h-9",
                        !task.due_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarClock className="mr-2 h-4 w-4" />
                      {task.due_date && isValid(new Date(task.due_date)) && new Date(task.due_date).getFullYear() > 1900 ? (
                        format(new Date(task.due_date), "MMM d, yyyy")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={task.due_date && isValid(new Date(task.due_date)) && new Date(task.due_date).getFullYear() > 1900 ? new Date(task.due_date) : undefined}
                      onSelect={handleDueDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {/* Overdue/Due Status Banner */}
                {task.due_date && isValid(new Date(task.due_date)) && new Date(task.due_date).getFullYear() > 1900 && (
                  <span className={cn(
                    "text-[10px] flex items-center gap-1 mt-1 font-medium",
                    isPast(new Date(task.due_date)) && task.status !== "Done" ? "text-red-500" : "text-muted-foreground"
                  )}>
                    {isPast(new Date(task.due_date)) && task.status !== "Done"
                      ? `Overdue ${formatDistanceToNow(new Date(task.due_date))}`
                      : `Due ${formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}`
                    }
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ────────────────── CONTEXT SECTION ────────────────── */}
          <div className="pt-2 border-t border-border mt-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-4">Context</h4>
            
            {/* Block Reason Display */}
            {(task as any).block_reason && (
              <div className="space-y-1.5 p-3 mb-6 rounded-lg bg-red-500/10 border border-red-500/20">
                <label className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Blocked Reason
                </label>
                <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap">{(task as any).block_reason}</p>
              </div>
            )}

            {/* Dependency Pre-requisite Linker */}
            <div className="space-y-1.5 mb-6">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dependency Linker</label>
              {dependencies.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {dependencies.map(dep => {
                    const depTask = allTasks?.find(t => t.id === dep.depends_on_task_id);
                    return depTask ? (
                      <div key={dep.id} className="text-[10px] font-semibold bg-muted px-2 py-1 rounded border border-border flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-muted-foreground" />
                        {depTask.title}
                      </div>
                    ) : null;
                  })}
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <select
                  value={depSelect}
                  onChange={(e) => setDepSelect(e.target.value)}
                  className="flex-1 bg-muted/30 border border-border rounded-lg px-2 py-2 text-sm outline-none focus:border-primary transition-colors h-9"
                  disabled={isLinking}
                >
                  <option value="">Attach Pre-requisite...</option>
                  {allTasks?.filter(t => t.id !== task.id && !dependencies.some(d => d.depends_on_task_id === t.id)).map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
                <Button 
                  size="sm" 
                  variant="outline" 
                  disabled={!depSelect || isLinking}
                  onClick={() => {
                    if (!depSelect) return;
                    setIsLinking(true);
                    startTransition(async () => {
                      const res = await addTaskDependency(task.id, depSelect, task.project_id!);
                      if (res.success) {
                        toast.success("Dependency Linked");
                        getTaskDependencies(task.id).then(setDependencies);
                        setDepSelect("");
                      } else {
                        toast.error(res.error || "Failed");
                      }
                      setIsLinking(false);
                      router.refresh();
                    });
                  }}
                  className="h-9 w-9 p-0 bg-muted/30 border-border"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Contract Reference */}
            <div className="space-y-1.5 mb-6">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contract Reference</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Contract ID..."
                  className="flex-1 bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                  value={(metadata.contract_id as string) || ""}
                  onChange={(e) => {
                    startTransition(async () => {
                      await updateTask(task.id, {
                        metadata: { ...metadata, contract_id: e.target.value } as any
                      });
                      router.refresh();
                    });
                  }}
                />
                <input
                  type="text"
                  placeholder="Doc Page Ref..."
                  className="w-32 bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                  value={(metadata.doc_page_ref as string) || ""}
                  onChange={(e) => {
                    startTransition(async () => {
                      await updateTask(task.id, {
                        metadata: { ...metadata, doc_page_ref: e.target.value } as any
                      });
                      router.refresh();
                    });
                  }}
                />
              </div>
            </div>
          </div>

          {/* ────────────────── FOOTER SECTION ────────────────── */}
          <div className="pt-8 border-t border-border mt-8 flex flex-col gap-3">
            {showBlockInput ? (
              <div className="flex w-full gap-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Reason for blocking..."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleBlock()}
                  className="flex-1 bg-muted/30 border border-border rounded-lg px-3 text-sm outline-none focus:border-red-500 transition-colors"
                  autoComplete="off"
                />
                <Button size="sm" variant="destructive" onClick={handleBlock}>
                  Submit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => {
                  setShowBlockInput(false);
                  setBlockReason("");
                }}>
                  Cancel
                </Button>
              </div>
            ) : showDeleteConfirm ? (
              <div className="flex w-full gap-2">
                <Button size="sm" variant="destructive" className="flex-1" onClick={handleDelete}>
                  Confirm Delete
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                {task.status !== "Done" && (
                  <div className="flex gap-2 w-full">
                    <Button variant="default" className="flex-1 gap-2" onClick={handleComplete}>
                      <CheckCircle2 className="w-4 h-4" /> Complete
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2" onClick={handleSkip}>
                      <SkipForward className="w-4 h-4" /> Skip
                    </Button>
                  </div>
                )}
                
                <div className="flex gap-2 w-full mt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20" 
                    onClick={() => setShowBlockInput(true)}
                  >
                    <AlertCircle className="w-4 h-4" /> Block
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20" 
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </Button>
                </div>
                <div className="flex gap-2 w-full mt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2 text-foreground bg-primary/5 hover:bg-primary/20 border-primary/20" 
                    onClick={handleDelegate}
                  >
                    <Bot className="w-4 h-4" /> Delegate
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </SheetContent>

      <DelegateModal
        taskId={task.id}
        isOpen={isDelegateModalOpen}
        onClose={() => setIsDelegateModalOpen(false)}
        taskCategory={(task as any).category}
      />
    </Sheet>
  );
}
