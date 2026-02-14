"use client";

import { useDraggable } from "@dnd-kit/core";
import { Task } from "@/types/database";
import { cn } from "@/lib/utils";

interface DraggableTaskCardProps {
  task: Task;
  children: React.ReactNode;
  className?: string;
}

export function DraggableTaskCard({ task, children, className }: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(className, "cursor-grab active:cursor-grabbing", isDragging && "opacity-40")}
    >
      {children}
    </div>
  );
}
