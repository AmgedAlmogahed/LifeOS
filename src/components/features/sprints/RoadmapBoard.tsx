"use client";

import { useState, useTransition } from "react";
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
  defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import { 
  arrayMove, 
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Project, Sprint, Task } from "@/types/database";
import type { ScopeNode } from "@/lib/actions/scope-nodes";
import { SprintControl } from "./SprintControl";
import { DroppableSprintBlock } from "./DroppableSprintBlock";
import { SortableTaskCard } from "./SortableTaskCard";
import { SprintReview } from "./SprintReview";


interface RoadmapBoardProps {
  project: Project;
  sprints: Sprint[];
  tasks: Task[];
  activeScopeId?: string | null;
  onTaskClick: (task: Task) => void;
  lockedTaskIds?: Set<string>;
  scopeNodes?: ScopeNode[];
}

/**
 * RoadmapBoard
 *
 * tasksMap is keyed by sprint_id (or "backlog").
 * DroppableSprintBlock receives a flat list of tasks and handles status grouping internally.
 * Drag-and-drop between sprint sections updates sprint_id.
 * Drag-and-drop between Kanban columns (within a sprint) updates status.
 * The droppable IDs from DroppableSprintBlock columns follow `{sprintId}::{status}`.
 */
export function RoadmapBoard({ project, sprints, tasks, activeScopeId, onTaskClick, lockedTaskIds = new Set(), scopeNodes = [] }: RoadmapBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [conflictSprintToClose, setConflictSprintToClose] = useState<Sprint | null>(null);
  const concurrentlyActiveSprint = sprints.find(s => s.status === 'active');

  // tasksMap keys: sprint.id OR "backlog" → flat array of tasks
  const [tasksMap, setTasksMap] = useState<Record<string, Task[]>>(() => {
    const map: Record<string, Task[]> = { backlog: [] };
    sprints.forEach(s => { map[s.id] = []; });
    tasks.forEach(t => {
      const key = t.sprint_id && map[t.sprint_id] !== undefined ? t.sprint_id : "backlog";
      map[key].push(t);
    });
    return map;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string);
  };

  /**
   * findContainer returns the sprint/backlog key for a given task ID or droppable ID.
   * Droppable column IDs come in as `{sprintId}::{status}`, so we strip the status suffix.
   */
  const findContainer = (id: string): string | undefined => {
    // Direct key match (e.g., "backlog" or a sprint id itself)
    if (id in tasksMap) return id;

    // Column droppable: "{sprintId}::{status}" or "backlog::{status}"
    if (id.includes("::")) {
      const [sprintPart] = id.split("::");
      if (sprintPart in tasksMap) return sprintPart;
    }

    // Task id – find which container holds it
    for (const key of Object.keys(tasksMap)) {
      if (tasksMap[key].some(task => task.id === id)) return key;
    }
    return undefined;
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const activeTaskId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(activeTaskId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setTasksMap(prev => {
      const activeItems = prev[activeContainer] || [];
      const overItems = prev[overContainer] || [];
      const activeIndex = activeItems.findIndex(t => t.id === activeTaskId);
      const overTaskIndex = overItems.findIndex(t => t.id === overId);

      const newIndex = overTaskIndex >= 0 ? overTaskIndex : overItems.length;
      const draggedItem = activeItems[activeIndex];
      if (!draggedItem) return prev;

      // Optimistically update status if dropped into a status column
      let updatedItem = draggedItem;
      if (overId.includes("::")) {
        const [, overStatus] = overId.split("::");
        updatedItem = { ...draggedItem, status: overStatus as Task["status"] };
      }

      return {
        ...prev,
        [activeContainer]: activeItems.filter(item => item.id !== activeTaskId),
        [overContainer]: [
          ...overItems.slice(0, newIndex),
          updatedItem,
          ...overItems.slice(newIndex),
        ],
      };
    });
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;
    const activeContainer = findContainer(activeTaskId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer) return;

    // Find the original task from the server data list
    const activeTask = tasks.find(t => t.id === activeTaskId);
    if (!activeTask) return;

    const targetSprintId = overContainer === "backlog" ? null : overContainer;

    // Determine status change from column id
    let targetStatus: string | undefined;
    if (overId.includes("::")) {
      const [, status] = overId.split("::");
      targetStatus = status;
    }

    const hasSprintChanged = activeTask.sprint_id !== targetSprintId;
    const hasStatusChanged = targetStatus && activeTask.status !== targetStatus;

    if (activeContainer === overContainer) {
      // Reorder within same container
      const activeIndex = tasksMap[activeContainer].findIndex(t => t.id === activeTaskId);
      const overIndex = tasksMap[activeContainer].findIndex(t => t.id === overId);
      if (activeIndex !== overIndex && activeIndex >= 0 && overIndex >= 0) {
        setTasksMap(items => ({
          ...items,
          [activeContainer]: arrayMove(items[activeContainer] || [], activeIndex, overIndex),
        }));
      }
    }

    // Persist changes
    if (hasSprintChanged || hasStatusChanged) {
      startTransition(async () => {
        if (hasSprintChanged) {
          const { moveTaskToSprint } = await import("@/lib/actions/flow-board");
          await moveTaskToSprint(activeTaskId, targetSprintId, project.id);
        }
        if (hasStatusChanged) {
          const { updateTaskStatus } = await import("@/lib/actions/flow-board");
          await updateTaskStatus(activeTaskId, targetStatus as any);
        }
      });
    }
  };

  const handleStartSprintRequest = (sprintToStart: Sprint) => {
    if (concurrentlyActiveSprint && concurrentlyActiveSprint.id !== sprintToStart.id) {
      setConflictSprintToClose(concurrentlyActiveSprint);
    } else {
      startTransition(async () => {
        const { startSprint } = await import("@/lib/actions/sprints");
        const res = await startSprint(sprintToStart.id, project.id);
        if (res?.error) {
          alert(res.error);
        }
      });
    }
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;
  const backlogTasks = tasksMap["backlog"] || [];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="p-4 space-y-6 pb-32">
        {/* Sprints Timeline */}
        {sprints.length === 0 ? (
          <div>
            <SprintControl project={project} activeSprint={null} tasks={backlogTasks} />
          </div>
        ) : (
          <div className="space-y-6">
            {sprints.map((sprint) => (
              <DroppableSprintBlock
                key={sprint.id}
                sprint={sprint}
                project={project}
                tasks={tasksMap[sprint.id] || []}
                isHighlighted={!!activeScopeId && (tasksMap[sprint.id] || []).length > 0}
                onTaskClick={onTaskClick}
                onStartRequest={() => handleStartSprintRequest(sprint)}
                lockedTaskIds={lockedTaskIds}
                scopeNodes={scopeNodes}
              />
            ))}

            {/* Plan next sprint prompt if none is in planning */}
            {sprints[sprints.length - 1].status !== "planning" && (
              <div className="pt-4 border-t border-border flex justify-center">
                <SprintControl project={project} activeSprint={null} tasks={backlogTasks} />
              </div>
            )}
          </div>
        )}

        {/* Backlog */}
        <div className="pt-6 border-t-2 border-dashed border-border/50">
          <DroppableSprintBlock
            isBacklog
            sprintId="backlog"
            tasks={backlogTasks}
            isHighlighted={!!activeScopeId && backlogTasks.length > 0}
            onTaskClick={onTaskClick}
            lockedTaskIds={lockedTaskIds}
            scopeNodes={scopeNodes}
          />
        </div>
      </div>

      <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } })}}>
        {activeTask ? (
          <div className="opacity-80 rotate-2 scale-105 cursor-grabbing">
            <SortableTaskCard task={activeTask} onTaskClick={() => {}} />
          </div>
        ) : null}
      </DragOverlay>

      {/* Conflict Resolution: close old sprint before starting new */}
      {conflictSprintToClose && (
        <SprintReview
          sprint={conflictSprintToClose}
          tasks={tasksMap[conflictSprintToClose.id] || []}
          open={!!conflictSprintToClose}
          onOpenChange={(open) => !open && setConflictSprintToClose(null)}
        />
      )}
    </DndContext>
  );
}
