"use client";

import { useEffect, useRef } from "react";
import { Task } from "@/types/database";
import { BarChart2 } from "lucide-react";

// Minimal frappe-gantt type shim
interface GanttTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies?: string;
}

interface GanttViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onLink?: (sourceId: string, targetId: string) => void;
}

function toDateStr(d: string | null | undefined): string | null {
  if (!d) return null;
  const date = new Date(d);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split("T")[0];
}

export function GanttView({ tasks, onTaskClick, onLink }: GanttViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<unknown>(null);

  // Filter to tasks that have both start_date and due_date
  // Cast to any because generated types don't include new columns until next type-gen run
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const datedTasks = tasks.filter((t) => (t as any).start_date && t.due_date);

  useEffect(() => {
    if (!containerRef.current || datedTasks.length === 0) return;

    // Dynamic import to skip SSR
    import("frappe-gantt").then((module) => {
      const Gantt = module.default ?? module;

      const ganttTasks: GanttTask[] = datedTasks.map((t) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyT = t as any;
        return {
          id: t.id,
          name: t.title,
          start: toDateStr(anyT.start_date) ?? toDateStr(t.due_date) ?? "",
          end: toDateStr(t.due_date) ?? "",
          progress: t.status === "Done" ? 100 : t.status === "In Progress" ? 50 : 0,
        };
      });

      // Clear previous render
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.id = "gantt-chart";
        containerRef.current.appendChild(svg);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ganttRef.current = new (Gantt as any)("#gantt-chart", ganttTasks, {
        view_mode: "Week",
        date_format: "YYYY-MM-DD",
        on_click: (task: GanttTask) => {
          const original = datedTasks.find((t) => t.id === task.id);
          if (original && onTaskClick) onTaskClick(original);
        },
        on_link: (link: { source: { task: GanttTask }; target: { task: GanttTask } }) => {
          if (onLink) onLink(link.source.task.id, link.target.task.id);
        },
        custom_popup_html: (task: GanttTask) =>
          `<div class="details-container" style="padding:8px;min-width:200px">
            <h5 style="font-size:13px;font-weight:600;margin:0 0 4px">${task.name}</h5>
            <p style="font-size:11px;margin:0;opacity:0.6">${task.start} → ${task.end}</p>
          </div>`,
      });
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datedTasks.map((t) => t.id + (t as any).start_date + t.due_date + t.status).join(",")]);

  if (datedTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center py-8">
        <BarChart2 className="w-12 h-12 text-muted-foreground/20 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No timeline data</p>
        <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
          Assign a <strong>Start Date</strong> and <strong>Due Date</strong> to tasks via the
          Task Drawer to visualize them here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 overflow-x-auto">
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/frappe-gantt/dist/frappe-gantt.css"
      />
      <div
        ref={containerRef}
        className="gantt-wrapper [&_.gantt]:font-sans [&_.bar-progress]:fill-primary [&_.bar-label]:fill-foreground"
      />
    </div>
  );
}
