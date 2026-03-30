"use client";

import { useState, useEffect, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Sprint, Project, Task } from "@/types/database";
import type { ScopeNode } from "@/lib/actions/scope-nodes";
import { SortableTaskCard } from "./SortableTaskCard";
import { SprintControl } from "./SprintControl";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Inbox, List, LayoutGrid, Plus } from "lucide-react";

const KANBAN_STATUSES = ["Todo", "In Progress", "Blocked", "Done"] as const;
type KanbanStatus = (typeof KANBAN_STATUSES)[number];

interface DroppableSprintBlockProps {
  /** The droppable section id: sprint.id or "backlog" */
  sectionId: string;
  sprint?: Sprint;
  project?: Project;
  /** Tasks pre-grouped by status (from tasksMap in RoadmapBoard) */
  tasksByColumn: Record<KanbanStatus, Task[]>;
  /** All tasks in this section flattened (for list view & header counts) */
  flatTasks: Task[];
  isBacklog?: boolean;
  isHighlighted?: boolean;
  onTaskClick: (task: Task) => void;
  onStartRequest?: () => void;
  onCreateTask?: () => void;
  lockedTaskIds?: Set<string>;
  scopeNodes?: ScopeNode[];
}

// ── Kanban Column ────────────────────────────────────────────────────────────
function KanbanColumn({
  droppableId, title, tasks, onTaskClick, sprintStatus, lockedTaskIds,
}: {
  droppableId: string;
  title: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  sprintStatus?: string;
  lockedTaskIds?: Set<string>;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: droppableId });
  const ids = useMemo(() => tasks.map(t => t.id), [tasks]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-xl border min-w-[240px] w-[240px] shrink-0 bg-muted/20",
        isOver ? "border-primary border-dashed bg-primary/10" : "border-border/50"
      )}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</span>
        <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">{tasks.length}</span>
      </div>
      <div className="p-2 space-y-2 flex-1 min-h-[100px] overflow-y-auto">
        {tasks.length === 0 && !isOver && (
          <div className="flex items-center justify-center py-6 text-muted-foreground/30">
            <p className="text-[11px] font-medium uppercase tracking-wider">Empty</p>
          </div>
        )}
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onTaskClick={onTaskClick}
              disabled={sprintStatus === "completed"}
              isLocked={lockedTaskIds?.has(task.id) ?? false}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

// ── List Drop Zone (single droppable for list mode) ──────────────────────────
function ListDropZone({
  droppableId, tasks, onTaskClick, sprintStatus, lockedTaskIds,
}: {
  droppableId: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  sprintStatus?: string;
  lockedTaskIds?: Set<string>;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: droppableId });
  const ids = useMemo(() => tasks.map(t => t.id), [tasks]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border min-h-[56px] transition-colors",
        isOver ? "border-primary bg-primary/5" : "border-transparent"
      )}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5 p-2">
          {tasks.map(task => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onTaskClick={onTaskClick}
              disabled={sprintStatus === "completed"}
              isLocked={lockedTaskIds?.has(task.id) ?? false}
            />
          ))}
        </div>
      </SortableContext>
      {tasks.length === 0 && !isOver && (
        <p className="text-center text-[11px] text-muted-foreground/40 py-4 font-medium uppercase tracking-wider">
          Empty
        </p>
      )}
    </div>
  );
}

// ── Module Distribution Chips ────────────────────────────────────────────────
function ModuleChips({ tasks, scopeNodes }: { tasks: Task[]; scopeNodes: ScopeNode[] }) {
  const chips = useMemo(() => {
    if (tasks.length === 0) return [];
    const counter: Record<string, number> = {};
    tasks.forEach(t => {
      const node = scopeNodes.find(n => n.id === (t as any).scope_node_id);
      const label = node?.title ?? "Unassigned";
      counter[label] = (counter[label] ?? 0) + 1;
    });
    return Object.entries(counter)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, pct: Math.round((count / tasks.length) * 100) }));
  }, [tasks, scopeNodes]);

  if (chips.length === 0) return null;
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {chips.map(({ name, pct }) => (
        <span key={name} className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
          {pct}% {name}
        </span>
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export function DroppableSprintBlock({
  sectionId, sprint, project, tasksByColumn, flatTasks, isBacklog,
  isHighlighted, onTaskClick, onStartRequest, onCreateTask, lockedTaskIds, scopeNodes = [],
}: DroppableSprintBlockProps) {

  const [isFolded, setIsFolded] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  useEffect(() => {
    const folded = localStorage.getItem(`sprint-folded-${sectionId}`);
    const view = localStorage.getItem(`sprint-view-${sectionId}`) as "list" | "kanban" | null;
    if (folded === "true") setIsFolded(true);
    if (view) setViewMode(view);
  }, [sectionId]);

  const toggleFold = () => {
    const next = !isFolded;
    setIsFolded(next);
    localStorage.setItem(`sprint-folded-${sectionId}`, String(next));
  };

  const toggleView = (mode: "list" | "kanban") => {
    setViewMode(mode);
    localStorage.setItem(`sprint-view-${sectionId}`, mode);
  };

  const doneCount = tasksByColumn["Done"]?.length ?? 0;
  const donePct = flatTasks.length > 0 ? Math.round((doneCount / flatTasks.length) * 100) : 0;

  return (
    <div className={cn(
      "rounded-xl border bg-card/10 overflow-hidden transition-all duration-300",
      isHighlighted
        ? "ring-2 ring-primary ring-offset-2 ring-offset-background border-primary shadow-primary/20 shadow-sm"
        : "border-border/50"
    )}>

      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50 bg-muted/10 flex-wrap gap-y-1.5">
        <button onClick={toggleFold} className="p-1 rounded hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors shrink-0">
          {isFolded ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <div className="flex-1 min-w-0">
          {!isBacklog && sprint && project ? (
            <SprintControl project={project} activeSprint={sprint} tasks={flatTasks} onStartRequest={onStartRequest} compact />
          ) : (
            <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Inbox className="w-4 h-4" /> Project Backlog
            </span>
          )}
        </div>

        {!isFolded && scopeNodes.length > 0 && <ModuleChips tasks={flatTasks} scopeNodes={scopeNodes} />}

          {/* Progress + count + view toggle + add */}
          <div className="flex items-center gap-2 shrink-0">
            {flatTasks.length > 0 && !isFolded && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <div className="w-16 h-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${donePct}%` }} />
                </div>
                <span className="font-medium">{donePct}%</span>
              </div>
            )}
            <span className="text-[11px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">{flatTasks.length}</span>

            {!isFolded && (
              <div className="flex items-center rounded-lg border border-border/50 overflow-hidden bg-background/50">
                <button onClick={() => toggleView("list")} title="List View"
                  className={cn("p-1.5 transition-colors", viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <List className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => toggleView("kanban")} title="Kanban View"
                  className={cn("p-1.5 transition-colors", viewMode === "kanban" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {onCreateTask && (
              <button
                onClick={onCreateTask}
                title="Add task"
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-primary border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-colors shrink-0"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            )}
          </div>
      </div>

      {/* ── Body ── */}
      {!isFolded && (
        viewMode === "list" ? (
          // List mode: single droppable zone using the "Todo" column id as the default
          // In list mode we show ALL tasks flat but drop into "Todo" status slot
          <div className="p-2">
            <ListDropZone
              droppableId={`${sectionId}::Todo`}
              tasks={flatTasks}
              onTaskClick={onTaskClick}
              sprintStatus={sprint?.status}
              lockedTaskIds={lockedTaskIds}
            />
          </div>
        ) : (
          // Kanban mode: 4 independent columns, each with its own droppable ID
          <div className="flex gap-3 p-3 overflow-x-auto min-h-[200px]">
            {KANBAN_STATUSES.map(status => (
              <KanbanColumn
                key={status}
                droppableId={`${sectionId}::${status}`}
                title={status}
                tasks={tasksByColumn[status] ?? []}
                onTaskClick={onTaskClick}
                sprintStatus={sprint?.status}
                lockedTaskIds={lockedTaskIds}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
