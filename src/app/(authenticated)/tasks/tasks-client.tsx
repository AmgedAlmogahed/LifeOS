"use client";

import { useState, useMemo } from "react";
import type { Task } from "@/types/database";
import { TaskDetailSheet } from "@/components/features/tasks/TaskDetailSheet";
import {
  Circle, Clock, CheckCircle2, AlertTriangle, XCircle,
  ListChecks, Filter, ChevronDown, CalendarClock,
} from "lucide-react";
import { formatDistanceToNow, isPast, isToday, isTomorrow, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

interface SimpleProject {
  id: string;
  name: string;
  status: string | null;
  category: string | null;
}

interface SimpleSprint {
  id: string;
  project_id: string;
  sprint_number: number;
  goal: string | null;
  status: string | null;
  planned_end_at: string | null;
}

interface SimpleModule {
  id: string;
  name: string;
  project_id: string;
}

interface TasksClientProps {
  tasks: Task[];
  projects: SimpleProject[];
  activeSprints: SimpleSprint[];
  modules: SimpleModule[];
}

type GroupBy = "project" | "module" | "dev_type" | "priority" | "status" | "flat";
type StatusFilter = "all" | "Todo" | "In Progress" | "Blocked" | "Done";
type DevTypeFilter = "all" | "frontend" | "backend" | "fullstack" | "design";

const statusIcon: Record<string, typeof Circle> = {
  "Todo": Circle,
  "In Progress": Clock,
  "Done": CheckCircle2,
  "Blocked": AlertTriangle,
  "Cancelled": XCircle,
};

const statusColor: Record<string, string> = {
  "Todo": "text-muted-foreground",
  "In Progress": "text-blue-500",
  "Done": "text-emerald-500",
  "Blocked": "text-red-500",
  "Cancelled": "text-muted-foreground/50",
};

const priorityColor: Record<string, string> = {
  "Critical": "text-red-500 bg-red-500/10",
  "High": "text-amber-500 bg-amber-500/10",
  "Medium": "text-blue-500 bg-blue-500/10",
  "Low": "text-muted-foreground bg-muted",
};

const priorityOrder: Record<string, number> = {
  "Critical": 0,
  "High": 1,
  "Medium": 2,
  "Low": 3,
};

function dueDateLabel(dateStr: string | null, status: string): { text: string; className: string } {
  if (!dateStr) return { text: "no date", className: "text-muted-foreground/40" };
  const date = new Date(dateStr);
  if (status === "Done") return { text: formatDistanceToNow(date, { addSuffix: true }), className: "text-muted-foreground" };
  if (isToday(date)) return { text: "today", className: "text-amber-500 font-medium" };
  if (isTomorrow(date)) return { text: "tomorrow", className: "text-amber-500" };
  if (isPast(date)) {
    const daysAgo = differenceInDays(new Date(), date);
    return { text: `overdue ${daysAgo}d`, className: "text-red-500 font-medium" };
  }
  const daysUntil = differenceInDays(date, new Date());
  return { text: `in ${daysUntil}d`, className: "text-muted-foreground" };
}

export function TasksClient({ tasks, projects, activeSprints, modules }: TasksClientProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [devTypeFilter, setDevTypeFilter] = useState<DevTypeFilter>("all");
  const [groupBy, setGroupBy] = useState<GroupBy>("project");
  const [showDone, setShowDone] = useState(false);

  const projectMap = useMemo(() => {
    const map: Record<string, SimpleProject> = {};
    projects.forEach(p => { map[p.id] = p; });
    return map;
  }, [projects]);

  const moduleMap = useMemo(() => {
    const map: Record<string, SimpleModule> = {};
    modules.forEach(m => { map[m.id] = m; });
    return map;
  }, [modules]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskSheetOpen(true);
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    // Exclude cancelled tasks client-side
    let result = tasks.filter(t => t.status !== "Cancelled");

    if (projectFilter !== "all") {
      if (projectFilter === "personal") {
        result = result.filter(t => !t.project_id);
      } else {
        result = result.filter(t => t.project_id === projectFilter);
      }
    }

    if (statusFilter !== "all") {
      result = result.filter(t => t.status === statusFilter);
    }

    if (devTypeFilter !== "all") {
      result = result.filter(t => t.dev_type === devTypeFilter);
    }

    return result;
  }, [tasks, projectFilter, statusFilter, devTypeFilter]);

  // Separate done tasks
  const activeTasks = filteredTasks.filter(t => t.status !== "Done");
  const doneTasks = filteredTasks.filter(t => t.status === "Done");

  // Group tasks
  const groupedTasks = useMemo(() => {
    const groups: { id: string; label: string; tasks: Task[] }[] = [];

    if (groupBy === "flat") {
      groups.push({ id: "all", label: "All Tasks", tasks: activeTasks });
      return groups;
    }

    if (groupBy === "project") {
      const byProject: Record<string, Task[]> = {};
      activeTasks.forEach(t => {
        const key = t.project_id || "personal";
        if (!byProject[key]) byProject[key] = [];
        byProject[key].push(t);
      });
      Object.entries(byProject).forEach(([key, projectTasks]) => {
        const label = key === "personal" ? "Personal" : (projectMap[key]?.name || "Unknown Project");
        groups.push({ id: key, label: `${label} (${projectTasks.length})`, tasks: projectTasks });
      });
      // Sort groups: projects first alphabetically, then Personal at the end
      groups.sort((a, b) => {
        if (a.label.startsWith("Personal")) return 1;
        if (b.label.startsWith("Personal")) return -1;
        return a.label.localeCompare(b.label);
      });
      return groups;
    }

    if (groupBy === "module") {
      const byModule: Record<string, Task[]> = {};
      activeTasks.forEach(t => {
        const key = t.module_id || "unassigned";
        if (!byModule[key]) byModule[key] = [];
        byModule[key].push(t);
      });
      Object.entries(byModule).forEach(([key, moduleTasks]) => {
        const label = key === "unassigned" ? "Unassigned Module" : (moduleMap[key]?.name || "Unknown Module");
        groups.push({ id: key, label: `${label} (${moduleTasks.length})`, tasks: moduleTasks });
      });
      groups.sort((a, b) => {
        if (a.id === "unassigned") return 1;
        if (b.id === "unassigned") return -1;
        return a.label.localeCompare(b.label);
      });
      return groups;
    }

    if (groupBy === "dev_type") {
      const byDevType: Record<string, Task[]> = {};
      activeTasks.forEach(t => {
        const key = t.dev_type || "unassigned";
        if (!byDevType[key]) byDevType[key] = [];
        byDevType[key].push(t);
      });
      ["frontend", "backend", "fullstack", "design", "unassigned"].forEach(dt => {
         if (byDevType[dt]?.length) {
            groups.push({ id: dt, label: `${dt.toUpperCase()} (${byDevType[dt].length})`, tasks: byDevType[dt] });
         }
      });
      return groups;
    }

    if (groupBy === "priority") {
      const byPriority: Record<string, Task[]> = {};
      activeTasks.forEach(t => {
        const key = t.priority || "Medium";
        if (!byPriority[key]) byPriority[key] = [];
        byPriority[key].push(t);
      });
      ["Critical", "High", "Medium", "Low"].forEach(p => {
        if (byPriority[p]?.length) {
          groups.push({ id: p, label: `${p} (${byPriority[p].length})`, tasks: byPriority[p] });
        }
      });
      return groups;
    }

    if (groupBy === "status") {
      const byStatus: Record<string, Task[]> = {};
      activeTasks.forEach(t => {
        const key = t.status || "Todo";
        if (!byStatus[key]) byStatus[key] = [];
        byStatus[key].push(t);
      });
      ["In Progress", "Todo", "Blocked"].forEach(s => {
        if (byStatus[s]?.length) {
          groups.push({ id: s, label: `${s} (${byStatus[s].length})`, tasks: byStatus[s] });
        }
      });
      return groups;
    }

    return groups;
  }, [activeTasks, groupBy, projectMap]);

  const totalActive = activeTasks.length;
  const totalDone = doneTasks.length;

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center px-6 bg-card/40 backdrop-blur-sm shrink-0">
        <ListChecks className="w-5 h-5 text-primary mr-3" />
        <span className="text-sm font-bold text-foreground">All Tasks</span>
        <span className="text-xs text-muted-foreground ml-2">({totalActive} active{totalDone > 0 ? `, ${totalDone} done` : ""})</span>
      </div>

      {/* Filter Bar */}
      <div className="border-b border-border px-6 py-3 flex items-center gap-3 flex-wrap bg-card/20">
        {/* Project filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="text-xs bg-muted/30 border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-primary transition-colors cursor-pointer"
          >
            <option value="all">All Projects</option>
            <option value="personal">Personal (no project)</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Status filter toggles */}
        <div className="flex items-center gap-1">
          {(["all", "Todo", "In Progress", "Blocked", "Done"] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors",
                statusFilter === s
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/40"
              )}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>

        {/* Dev Type filter */}
        <div className="flex items-center gap-1.5 border-l border-border/50 pl-3">
          <select
            value={devTypeFilter}
            onChange={(e) => setDevTypeFilter(e.target.value as DevTypeFilter)}
            className="text-[11px] font-medium bg-transparent border-0 outline-none focus:ring-0 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="frontend">Frontend</option>
            <option value="backend">Backend</option>
            <option value="fullstack">Fullstack</option>
            <option value="design">Design</option>
          </select>
        </div>

        {/* Group by */}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Group</span>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="text-xs bg-muted/30 border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-primary transition-colors cursor-pointer"
          >
            <option value="project">By Project</option>
            <option value="module">By Module</option>
            <option value="dev_type">By Dev Type</option>
            <option value="priority">By Priority</option>
            <option value="status">By Status</option>
            <option value="flat">Flat List</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 fade-in">
        {groupedTasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ListChecks className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No tasks match your filters.</p>
          </div>
        )}

        {groupedTasks.map((group) => (
          <div key={group.id}>
            {/* Group header */}
            {groupBy !== "flat" && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary/40" />
                {group.label}
              </h3>
            )}

            <div className="space-y-1">
              {group.tasks.map(task => {
                const Icon = statusIcon[task.status] ?? Circle;
                const due = dueDateLabel(task.due_date, task.status);
                const projectName = task.project_id ? (projectMap[task.project_id]?.name || "Unknown") : null;

                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-accent/15 hover:bg-accent/25 transition-colors cursor-pointer group"
                    onClick={() => handleTaskClick(task)}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0", statusColor[task.status] || "")} />
                    <span className="text-sm font-medium text-foreground flex-1 truncate">{task.title}</span>

                    {/* Project chip (when not grouping by project) */}
                    {groupBy !== "project" && projectName && (
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground shrink-0 hidden sm:inline">
                        {projectName}
                      </span>
                    )}
                    {groupBy !== "project" && !projectName && (
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground/50 shrink-0 hidden sm:inline">
                        Personal
                      </span>
                    )}

                    {/* Dev Type tag */}
                    {task.dev_type && (
                        <span className="text-[9px] font-medium px-2 py-0.5 rounded border border-border shrink-0 text-muted-foreground capitalize">
                          {task.dev_type}
                        </span>
                    )}

                    {/* Priority */}
                    <span className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded shrink-0",
                      priorityColor[task.priority] || ""
                    )}>
                      {task.priority}
                    </span>

                    {/* Due date */}
                    <span className={cn("text-[10px] shrink-0 flex items-center gap-0.5", due.className)}>
                      <CalendarClock className="w-2.5 h-2.5" />
                      {due.text}
                    </span>

                    {/* Story points */}
                    {task.story_points && (
                      <span className="text-[10px] text-muted-foreground/50 shrink-0 hidden md:inline">
                        {task.story_points}pt
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Done tasks (collapsible) */}
        {doneTasks.length > 0 && statusFilter !== "Done" && (
          <details open={showDone} onToggle={(e) => setShowDone((e.target as HTMLDetailsElement).open)}>
            <summary className="cursor-pointer text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2 hover:text-foreground transition-colors select-none">
              <ChevronDown className={cn("w-3 h-3 transition-transform", showDone && "rotate-180")} />
              Completed ({doneTasks.length})
            </summary>
            <div className="space-y-1 opacity-60">
              {doneTasks.map(task => {
                const projectName = task.project_id ? (projectMap[task.project_id]?.name || "Unknown") : null;
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors cursor-pointer"
                    onClick={() => handleTaskClick(task)}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-sm text-muted-foreground flex-1 truncate line-through">{task.title}</span>
                    {projectName && (
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground shrink-0 hidden sm:inline">
                        {projectName}
                      </span>
                    )}
                    {task.completed_at && (
                      <span className="text-[10px] text-muted-foreground/50 shrink-0">
                        {formatDistanceToNow(new Date(task.completed_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </details>
        )}
      </div>

      {/* Task Detail Sheet */}
      <TaskDetailSheet
        task={selectedTask}
        open={isTaskSheetOpen}
        onOpenChange={(open) => {
          setIsTaskSheetOpen(open);
          if (!open) setSelectedTask(null);
        }}
        projectName={selectedTask?.project_id ? projectMap[selectedTask.project_id]?.name : undefined}
      />
    </div>
  );
}
