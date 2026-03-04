"use client";

import { useState, useEffect, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Sprint, Project, Task } from "@/types/database";
import type { ScopeNode } from "@/lib/actions/scope-nodes";
import { SortableTaskCard } from "./SortableTaskCard";
import { SprintControl } from "./SprintControl";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Inbox, List, LayoutGrid } from "lucide-react";

interface DroppableSprintBlockProps {
  sprint?: Sprint;
  sprintId?: string;
  project?: Project;
  tasks: Task[];
  isBacklog?: boolean;
  isHighlighted?: boolean;
  onTaskClick: (task: Task) => void;
  onStartRequest?: () => void;
  lockedTaskIds?: Set<string>;
  scopeNodes?: ScopeNode[];
}

const KANBAN_COLUMNS = ["Todo", "In Progress", "Blocked", "Done"] as const;
type KanbanColumn = typeof KANBAN_COLUMNS[number];

// ── Kanban Column ────────────────────────────────────────────────────────────
function KanbanColumnDroppable({
  id, title, tasks, onTaskClick, sprintStatus, lockedTaskIds,
}: {
  id: string; title: string; tasks: Task[];
  onTaskClick: (task: Task) => void; sprintStatus?: string;
  lockedTaskIds?: Set<string>;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const taskIds = useMemo(() => tasks.map(t => t.id), [tasks]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col bg-muted/20 rounded-xl min-w-[240px] w-[240px] shrink-0 border",
        isOver ? "border-primary border-dashed bg-primary/10" : "border-border/50"
      )}
    >
      <div className="flex items-center justify-between p-3 border-b border-border/50 shrink-0">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</span>
        <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">{tasks.length}</span>
      </div>
      <div className="p-2 space-y-2 flex-1 overflow-y-auto min-h-[120px]">
        {tasks.length === 0 && !isOver && (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground/30 border-2 border-dashed border-transparent rounded-lg py-6">
            <p className="text-[11px] font-medium uppercase tracking-wider">Empty</p>
          </div>
        )}
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
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

// ── List Drop Zone ───────────────────────────────────────────────────────────
function ListDropZone({
  id, tasks, onTaskClick, sprintStatus, lockedTaskIds
}: {
  id: string; tasks: Task[]; onTaskClick: (task: Task) => void;
  sprintStatus?: string; lockedTaskIds?: Set<string>;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const taskIds = useMemo(() => tasks.map(t => t.id), [tasks]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border transition-colors min-h-[60px]",
        isOver ? "border-primary bg-primary/5" : "border-transparent"
      )}
    >
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
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
        <p className="text-center text-[11px] text-muted-foreground/40 py-4 uppercase tracking-wider font-medium">Empty</p>
      )}
    </div>
  );
}

// ── Module Distribution Chip ─────────────────────────────────────────────────
function ModuleDistributionChips({ tasks, scopeNodes }: { tasks: Task[]; scopeNodes: ScopeNode[] }) {
  const distribution = useMemo(() => {
    const counter: Record<string, number> = {};
    tasks.forEach(t => {
      const moduleId = (t as any).scope_node_id;
      if (!moduleId) { counter["Unassigned"] = (counter["Unassigned"] || 0) + 1; return; }
      const node = scopeNodes.find(n => n.id === moduleId);
      const label = node?.title ?? "Unknown";
      counter[label] = (counter[label] || 0) + 1;
    });

    const total = tasks.length || 1;
    return Object.entries(counter)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, pct: Math.round((count / total) * 100) }));
  }, [tasks, scopeNodes]);

  if (distribution.length === 0 || tasks.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {distribution.map(({ name, pct }) => (
        <span
          key={name}
          className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 whitespace-nowrap"
        >
          {pct}% {name}
        </span>
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export function DroppableSprintBlock({
  sprint, sprintId, project, tasks, isBacklog, isHighlighted, onTaskClick, onStartRequest,
  lockedTaskIds, scopeNodes = [],
}: DroppableSprintBlockProps) {

  const id = isBacklog ? "backlog" : (sprint?.id || sprintId || "");

  const [isFolded, setIsFolded] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  useEffect(() => {
    const folded = localStorage.getItem(`sprint-folded-${id}`);
    const view = localStorage.getItem(`sprint-view-${id}`) as "list" | "kanban" | null;
    if (folded === "true") setIsFolded(true);
    if (view === "kanban" || view === "list") setViewMode(view);
  }, [id]);

  const toggleFold = () => {
    const next = !isFolded;
    setIsFolded(next);
    localStorage.setItem(`sprint-folded-${id}`, next.toString());
  };

  const toggleView = (mode: "list" | "kanban") => {
    setViewMode(mode);
    localStorage.setItem(`sprint-view-${id}`, mode);
  };

  const tasksByStatus = useMemo(() => {
    const acc: Record<KanbanColumn, Task[]> = {
      "Todo": [], "In Progress": [], "Blocked": [], "Done": []
    };
    tasks.forEach(t => {
      const status = (KANBAN_COLUMNS.includes(t.status as KanbanColumn) ? t.status : "Todo") as KanbanColumn;
      acc[status].push(t);
    });
    return acc;
  }, [tasks]);

  const donePct = tasks.length > 0
    ? Math.round((tasksByStatus["Done"].length / tasks.length) * 100)
    : 0;

  return (
    <div className={cn(
      "rounded-xl transition-all duration-300 border bg-card/10 overflow-hidden",
      isHighlighted
        ? "ring-2 ring-primary ring-offset-2 ring-offset-background border-primary shadow-sm shadow-primary/20"
        : "border-border/50"
    )}>

      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50 bg-muted/10 flex-wrap">
        <button
          onClick={toggleFold}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted/30 shrink-0"
        >
          {isFolded ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <div className="flex-1 min-w-0">
          {!isBacklog && sprint && project ? (
            <SprintControl
              project={project}
              activeSprint={sprint}
              tasks={tasks}
              onStartRequest={onStartRequest}
              compact
            />
          ) : (
            <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Inbox className="w-4 h-4" /> Project Backlog
            </span>
          )}
        </div>

        {/* Module distribution chips */}
        {!isFolded && scopeNodes.length > 0 && (
          <ModuleDistributionChips tasks={tasks} scopeNodes={scopeNodes} />
        )}

        {/* Progress + count + view toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {tasks.length > 0 && !isFolded && (
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-16 h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${donePct}%` }} />
              </div>
              <span className="font-medium">{donePct}%</span>
            </div>
          )}
          <span className="text-[11px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">{tasks.length}</span>

          {!isFolded && (
            <div className="flex items-center rounded-lg border border-border/50 overflow-hidden bg-background/50">
              <button
                onClick={() => toggleView("list")}
                title="List View"
                className={cn(
                  "p-1.5 transition-colors",
                  viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => toggleView("kanban")}
                title="Kanban View"
                className={cn(
                  "p-1.5 transition-colors",
                  viewMode === "kanban" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      {!isFolded && (
        <>
          {viewMode === "list" ? (
            <div className="p-2">
              <ListDropZone
                id={`${id}::Todo`}
                tasks={tasks}
                onTaskClick={onTaskClick}
                sprintStatus={sprint?.status}
                lockedTaskIds={lockedTaskIds}
              />
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-3 p-3 min-h-[200px]">
              {KANBAN_COLUMNS.map(col => (
                <KanbanColumnDroppable
                  key={col}
                  id={`${id}::${col}`}
                  title={col}
                  tasks={tasksByStatus[col]}
                  onTaskClick={onTaskClick}
                  sprintStatus={sprint?.status}
                  lockedTaskIds={lockedTaskIds}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
