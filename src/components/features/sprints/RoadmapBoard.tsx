"use client";

import { useState, useTransition, useMemo } from "react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Project, Sprint, Task } from "@/types/database";
import type { ScopeNode } from "@/lib/actions/scope-nodes";
import { SprintControl } from "./SprintControl";
import { DroppableSprintBlock } from "./DroppableSprintBlock";
import { SortableTaskCard } from "./SortableTaskCard";
import { SprintReview } from "./SprintReview";

const STATUSES = ["Todo", "In Progress", "Blocked", "Done"] as const;
type Status = (typeof STATUSES)[number];

/** Make a compound key from sprint/backlog id + status */
const key = (sprintId: string, status: string) => `${sprintId}::${status}`;

interface RoadmapBoardProps {
  project: Project;
  sprints: Sprint[];
  tasks: Task[];
  activeScopeId?: string | null;
  onTaskClick: (task: Task) => void;
  lockedTaskIds?: Set<string>;
  scopeNodes?: ScopeNode[];
  onCreateTask?: (sprintId: string | null) => void;
}

/**
 * RoadmapBoard — corrected DnD architecture
 *
 * `tasksMap` is ALWAYS keyed as `{sprintId|"backlog"}::{status}`.
 * Each KanbanColumn droppable id matches exactly one key in tasksMap.
 * This means dnd-kit can unambiguously track which column owns which tasks.
 *
 * DroppableSprintBlock receives `tasksByColumn: Record<Status, Task[]>` (pre-grouped).
 * For the list view, it still renders a single flat list derived from that same map.
 */
export function RoadmapBoard({
  project, sprints, tasks, activeScopeId, onTaskClick,
  lockedTaskIds = new Set(), scopeNodes = [], onCreateTask,
}: RoadmapBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [conflictSprintToClose, setConflictSprintToClose] = useState<Sprint | null>(null);
  const concurrentlyActiveSprint = sprints.find(s => s.status === "active");

  // ── tasksMap: keyed by "{sprintId|backlog}::{status}" ────────────────────
  const [tasksMap, setTasksMap] = useState<Record<string, Task[]>>(() => {
    const map: Record<string, Task[]> = {};
    const sections = ["backlog", ...sprints.map(s => s.id)];
    sections.forEach(sec => STATUSES.forEach(st => { map[key(sec, st)] = []; }));

    tasks.forEach(t => {
      const sec = t.sprint_id && sections.includes(t.sprint_id) ? t.sprint_id : "backlog";
      const st = STATUSES.includes(t.status as Status) ? t.status : "Todo";
      const k = key(sec, st);
      map[k] = map[k] ?? [];
      map[k].push(t);
    });
    return map;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── findContainer: map a task id → its column key ────────────────────────
  const findContainer = (id: string): string | undefined => {
    if (id in tasksMap) return id; // it's already a column key
    for (const k of Object.keys(tasksMap)) {
      if (tasksMap[k].some(t => t.id === id)) return k;
    }
    return undefined;
  };

  // ── handleDragStart ───────────────────────────────────────────────────────
  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string);
  };

  // ── handleDragOver: optimistic UI ────────────────────────────────────────
  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const activeTaskId = active.id as string;
    const overId = over.id as string;

    const activeCol = findContainer(activeTaskId);
    // The over target is either a column key directly, or a task id inside a column
    const overCol = findContainer(overId) ?? (overId in tasksMap ? overId : undefined);

    if (!activeCol || !overCol || activeCol === overCol) return;

    setTasksMap(prev => {
      const activeItems = [...(prev[activeCol] ?? [])];
      const overItems = [...(prev[overCol] ?? [])];
      const fromIdx = activeItems.findIndex(t => t.id === activeTaskId);
      if (fromIdx === -1) return prev;

      const [draggedTask] = activeItems.splice(fromIdx, 1);

      // Derive the status from the destination column key
      const [, newStatus] = overCol.split("::");
      const updatedTask = { ...draggedTask, status: newStatus as Task["status"] };

      // Insert at correct position in destination
      const overTaskIdx = overItems.findIndex(t => t.id === overId);
      const insertAt = overTaskIdx >= 0 ? overTaskIdx : overItems.length;
      overItems.splice(insertAt, 0, updatedTask);

      return { ...prev, [activeCol]: activeItems, [overCol]: overItems };
    });
  };

  // ── handleDragEnd: persist to DB ─────────────────────────────────────────
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    const activeCol = findContainer(activeTaskId);
    const overCol = findContainer(overId) ?? (overId in tasksMap ? overId : undefined);

    if (!activeCol) return;

    const originalTask = tasks.find(t => t.id === activeTaskId);
    if (!originalTask) return;

    if (!overCol || activeCol === overCol) {
      // Reorder within same column
      if (overCol === activeCol) {
        const colItems = tasksMap[activeCol] ?? [];
        const fromIdx = colItems.findIndex(t => t.id === activeTaskId);
        const toIdx = colItems.findIndex(t => t.id === overId);
        if (fromIdx !== toIdx && fromIdx >= 0 && toIdx >= 0) {
          setTasksMap(prev => ({
            ...prev,
            [activeCol]: arrayMove([...(prev[activeCol] ?? [])], fromIdx, toIdx),
          }));
        }
      }
      return;
    }

    // Determine what changed
    const [overSec, overStatus] = overCol.split("::");
    const [origSec] = activeCol.split("::");

    const targetSprintId = overSec === "backlog" ? null : overSec;
    const hasSprintChanged = (originalTask.sprint_id ?? null) !== targetSprintId;
    const hasStatusChanged = originalTask.status !== overStatus;

    if (hasSprintChanged || hasStatusChanged) {
      startTransition(async () => {
        if (hasSprintChanged) {
          const { moveTaskToSprint } = await import("@/lib/actions/flow-board");
          await moveTaskToSprint(activeTaskId, targetSprintId, project.id);
        }
        if (hasStatusChanged) {
          const { updateTaskStatus } = await import("@/lib/actions/flow-board");
          await updateTaskStatus(activeTaskId, overStatus as any);
        }
      });
    }
  };

  // ── Derive per-sprint grouped data for DroppableSprintBlock ──────────────
  const getTasksByColumn = (sprintId: string): Record<Status, Task[]> => {
    const result = {} as Record<Status, Task[]>;
    STATUSES.forEach(st => { result[st] = tasksMap[key(sprintId, st)] ?? []; });
    return result;
  };

  const getFlatTasks = (sprintId: string): Task[] =>
    STATUSES.flatMap(st => tasksMap[key(sprintId, st)] ?? []);

  const handleStartSprintRequest = (sprintToStart: Sprint) => {
    if (concurrentlyActiveSprint && concurrentlyActiveSprint.id !== sprintToStart.id) {
      setConflictSprintToClose(concurrentlyActiveSprint);
    } else {
      startTransition(async () => {
        const { startSprint } = await import("@/lib/actions/sprints");
        const res = await startSprint(sprintToStart.id, project.id);
        if (res?.error) alert(res.error);
      });
    }
  };

  // The drag overlay shows the ghost card
  const activeTask = useMemo(
    () => activeId ? tasks.find(t => t.id === activeId) ?? null : null,
    [activeId, tasks]
  );

  const backlogByColumn = getTasksByColumn("backlog");
  const backlogFlat = getFlatTasks("backlog");

  return (
    <DndContext
      id="roadmap-dnd"
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="p-4 space-y-6 pb-32">

        {sprints.length === 0 ? (
          <div>
            <SprintControl project={project} activeSprint={null} tasks={backlogFlat} />
          </div>
        ) : (
          <div className="space-y-6">
            {sprints.map(sprint => {
              const byCol = getTasksByColumn(sprint.id);
              const flat = getFlatTasks(sprint.id);
              return (
                <DroppableSprintBlock
                  key={sprint.id}
                  sectionId={sprint.id}
                  sprint={sprint}
                  project={project}
                  tasksByColumn={byCol}
                  flatTasks={flat}
                  isHighlighted={!!activeScopeId && flat.length > 0}
                  onTaskClick={onTaskClick}
                  onStartRequest={() => handleStartSprintRequest(sprint)}
                  onCreateTask={onCreateTask ? () => onCreateTask(sprint.id) : undefined}
                  lockedTaskIds={lockedTaskIds}
                  scopeNodes={scopeNodes}
                />
              );
            })}

            {sprints[sprints.length - 1].status !== "planning" && (
              <div className="pt-4 border-t border-border flex justify-center">
                <SprintControl project={project} activeSprint={null} tasks={backlogFlat} />
              </div>
            )}
          </div>
        )}

        {/* Backlog */}
        <div className="pt-6 border-t-2 border-dashed border-border/50">
          <DroppableSprintBlock
            sectionId="backlog"
            isBacklog
            tasksByColumn={backlogByColumn}
            flatTasks={backlogFlat}
            isHighlighted={!!activeScopeId && backlogFlat.length > 0}
            onTaskClick={onTaskClick}
            onCreateTask={onCreateTask ? () => onCreateTask(null) : undefined}
            lockedTaskIds={lockedTaskIds}
            scopeNodes={scopeNodes}
          />
        </div>
      </div>

      <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } }) }}>
        {activeTask ? (
          <div className="opacity-80 rotate-2 scale-105 cursor-grabbing">
            <SortableTaskCard task={activeTask} onTaskClick={() => {}} />
          </div>
        ) : null}
      </DragOverlay>

      {conflictSprintToClose && (
        <SprintReview
          sprint={conflictSprintToClose}
          tasks={getFlatTasks(conflictSprintToClose.id)}
          open={!!conflictSprintToClose}
          onOpenChange={open => !open && setConflictSprintToClose(null)}
        />
      )}
    </DndContext>
  );
}
