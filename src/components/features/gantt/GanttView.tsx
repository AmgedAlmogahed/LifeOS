"use client";

import { useEffect, useRef, useMemo } from "react";
import { Task, Sprint } from "@/types/database";
import type { ScopeNode } from "@/lib/actions/scope-nodes";
import { BarChart2, Circle, CheckCircle2, AlertCircle, Pause } from "lucide-react";

// Minimal frappe-gantt type shim
interface GanttTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies?: string;
  custom_class?: string;
}

interface GanttViewProps {
  tasks: Task[];
  sprints?: Sprint[];
  scopeNodes?: ScopeNode[];
  onTaskClick?: (task: Task) => void;
  onLink?: (sourceId: string, targetId: string) => void;
  onDateChange?: (taskId: string, start: string, end: string) => void;
}

function toDateStr(d: string | null | undefined): string | null {
  if (!d) return null;
  const date = new Date(d);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split("T")[0];
}

/** Escape characters that are invalid in SVG/XML text nodes. */
function sanitizeStr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Ensure end is strictly after start (frappe-gantt crashes if start === end). */
function ensureEndAfterStart(start: string, end: string): string {
  if (end <= start) {
    const d = new Date(start);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }
  return end;
}

const TASK_STATUS_ICON: Record<string, React.ReactNode> = {
  "Todo":        <Circle className="w-3 h-3 text-muted-foreground shrink-0" />,
  "In Progress": <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />,
  "Done":        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />,
  "Blocked":     <Pause className="w-3 h-3 text-red-500 shrink-0" />,
};

export function GanttView({ tasks, sprints = [], scopeNodes = [], onTaskClick, onLink, onDateChange }: GanttViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<unknown>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const safeTasks = tasks.map(t => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyT = t as any;
    return {
      ...t,
      start_date: anyT.start_date || todayStr,
      due_date: t.due_date || todayStr,
    };
  });

  // Build Module → Tasks hierarchy for left panel
  const moduleGroups = useMemo(() => {
    const unassigned: Task[] = [];
    const byModule: Record<string, { node: ScopeNode; tasks: Task[] }> = {};

    safeTasks.forEach(t => {
      const moduleId = (t as any).scope_node_id;
      const node = scopeNodes.find(n => n.id === moduleId);
      if (!node) {
        unassigned.push(t);
        return;
      }
      if (!byModule[node.id]) byModule[node.id] = { node, tasks: [] };
      byModule[node.id].tasks.push(t);
    });

    const groups: { id: string; label: string; tasks: Task[] }[] = [
      ...Object.values(byModule).map(({ node, tasks }) => ({
        id: node.id, label: node.title, tasks
      })),
    ];
    if (unassigned.length > 0) groups.push({ id: "__unassigned__", label: "Unassigned", tasks: unassigned });
    return groups;
  }, [safeTasks, scopeNodes]);

  useEffect(() => {
    if (!containerRef.current || safeTasks.length === 0) return;

    import("frappe-gantt").then((module) => {
      const Gantt = module.default ?? module;

      const ganttTasks: GanttTask[] = safeTasks.map(t => {
        const start = toDateStr((t as any).start_date) ?? todayStr;
        const rawEnd = toDateStr(t.due_date) ?? todayStr;
        const end = ensureEndAfterStart(start, rawEnd);
        return {
          id: t.id,
          name: sanitizeStr(t.title),
          start,
          end,
          progress: t.status === "Done" ? 100 : t.status === "In Progress" ? 50 : 0,
          custom_class: t.status === "Blocked" && (t as any).block_reason ? "blocked-task" : "",
        };
      });

      const sprintTasks: GanttTask[] = sprints
        .filter(s => s.started_at && (s.planned_end_at || s.ended_at))
        .map(s => {
          const sStart = toDateStr(s.started_at) ?? todayStr;
          const sRawEnd = toDateStr(s.ended_at || s.planned_end_at) ?? todayStr;
          const sEnd = ensureEndAfterStart(sStart, sRawEnd);
          const label = s.status === "active" ? "ACTIVE" : s.status === "completed" ? "DONE" : "PLANNED";
          return {
            id: s.id,
            name: sanitizeStr(`Phase ${s.sprint_number}: ${label}`),
            start: sStart,
            end: sEnd,
            progress: s.status === "completed" ? 100 : s.status === "active" ? 50 : 0,
            custom_class: `sprint-milestone sprint-${s.status}`,
          };
        });

      const allTasks = [...sprintTasks, ...ganttTasks];

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.id = "gantt-chart";
        containerRef.current.appendChild(svg);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ganttRef.current = new (Gantt as any)("#gantt-chart", allTasks, {
        view_mode: "Week",
        date_format: "YYYY-MM-DD",
        on_click: (task: GanttTask) => {
          const original = safeTasks.find(t => t.id === task.id);
          if (original && onTaskClick) onTaskClick(original);
        },
        on_link: (link: { source: { task: GanttTask }; target: { task: GanttTask } }) => {
          if (onLink) onLink(link.source.task.id, link.target.task.id);
        },
        custom_popup_html: (task: GanttTask) => {
          const original = safeTasks.find(t => t.id === task.id);
          const blockedReason = original?.status === "Blocked" ? (original as any).block_reason : null;
          return `
            <div class="details-container" style="padding:8px;min-width:200px">
              <h5 style="font-size:13px;font-weight:600;margin:0 0 4px">${task.name}</h5>
              <p style="font-size:11px;margin:0;opacity:0.6">${task.start} → ${task.end}</p>
              ${blockedReason ? `<div style="margin-top:4px;padding:4px;background:rgba(239,68,68,0.1);color:#ef4444;border-radius:4px;font-size:10px;font-weight:600;">Blocked: ${blockedReason}</div>` : ""}
            </div>
          `;
        },
        on_date_change: (task: GanttTask, start: Date, end: Date) => {
          if (onDateChange) onDateChange(task.id, start.toISOString(), end.toISOString());
        },
      });

      // Sync left panel scroll with Gantt scroll
      const ganttEl = containerRef.current?.querySelector(".gantt-container") as HTMLElement | null;
      if (ganttEl && leftPanelRef.current) {
        ganttEl.addEventListener("scroll", () => {
          if (leftPanelRef.current) {
            leftPanelRef.current.scrollTop = ganttEl.scrollTop;
          }
        });
      }

      // Inject double click listener for task creation
      if (containerRef.current) {
        const svg = containerRef.current.querySelector("svg");
        if (svg) {
          svg.addEventListener("dblclick", (e) => {
            if ((e.target as Element).closest(".bar-wrapper")) return;
            if (onTaskClick) onTaskClick({ id: "NEW_FROM_GANTT" } as any);
          });
        }
      }
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sprints.length, safeTasks.map(t => t.id + (t as any).start_date + t.due_date + t.status).join(",")]);

  if (safeTasks.length === 0 && sprints.length === 0) {
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
    <div className="flex h-full overflow-hidden">
      {/* ── Left Panel: Module → Task hierarchy ── */}
      <div
        ref={leftPanelRef}
        className="w-56 shrink-0 border-r border-border overflow-y-auto bg-card/5 flex flex-col"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Header row to align with Gantt column headers */}
        <div className="h-[56px] border-b border-border flex items-center px-3 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Module / Task</span>
        </div>

        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {moduleGroups.map(group => (
            <div key={group.id}>
              {/* Module row */}
              <div className="px-3 py-1.5 border-b border-border/30 bg-muted/10 sticky top-0 z-10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80 truncate block">
                  {group.label}
                </span>
              </div>
              {/* Task rows */}
              {group.tasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => onTaskClick?.(task)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent/50 transition-colors border-b border-border/20 group"
                >
                  {TASK_STATUS_ICON[task.status] ?? TASK_STATUS_ICON.Todo}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-foreground truncate group-hover:text-primary transition-colors">
                      {task.title}
                    </p>
                    {task.due_date && (
                      <p className="text-[9px] text-muted-foreground/60 truncate">
                        Due {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel: Gantt Timeline ── */}
      <div className="flex-1 overflow-x-auto">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/frappe-gantt/dist/frappe-gantt.css" />
        <div
          ref={containerRef}
          className="gantt-wrapper [&_.gantt]:font-sans [&_.bar-progress]:fill-primary [&_.bar-label]:fill-foreground [&_.sprint-milestone_.bar-wrapper]:!opacity-50 [&_.sprint-milestone_.bar]:!fill-primary/20 [&_.sprint-milestone_.bar-progress]:!fill-primary/40 [&_.sprint-milestone_.bar-label]:!fill-muted-foreground [&_.sprint-milestone_.bar-label]:!font-bold [&_.sprint-milestone_.bar-label]:uppercase [&_.sprint-milestone_.bar-label]:tracking-wider [&_.blocked-task_.bar]:!fill-red-500/20 [&_.blocked-task_.bar-progress]:!fill-red-500/60"
        />
      </div>
    </div>
  );
}
