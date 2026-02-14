"use client";

import { useState, useMemo } from "react";
import type { Task } from "@/types/database";
import { TaskDetailSheet } from "@/components/features/tasks/TaskDetailSheet";
import {
  ChevronLeft, ChevronRight, CalendarDays, Diamond,
  Circle, Clock, CheckCircle2, AlertTriangle,
} from "lucide-react";
import {
  startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek,
  isSameDay, isSameMonth, isToday, isPast, format, addMonths, subMonths,
  differenceInDays, isWithinInterval, parseISO,
} from "date-fns";
import { cn } from "@/lib/utils";

interface SimpleProject {
  id: string;
  name: string;
  status: string | null;
  category: string | null;
  target_date?: string | null;
}

interface SimpleSprint {
  id: string;
  project_id: string;
  sprint_number: number;
  goal: string | null;
  status: string | null;
  started_at: string | null;
  planned_end_at: string | null;
}

interface CalendarClientProps {
  tasks: Task[];
  projects: SimpleProject[];
  sprints: SimpleSprint[];
}

const statusIcon: Record<string, typeof Circle> = {
  "Todo": Circle,
  "In Progress": Clock,
  "Done": CheckCircle2,
  "Blocked": AlertTriangle,
};

const statusColor: Record<string, string> = {
  "Todo": "bg-muted-foreground",
  "In Progress": "bg-blue-500",
  "Done": "bg-emerald-500",
  "Blocked": "bg-red-500",
};

const sprintColors = [
  "bg-primary/60",
  "bg-chart-3/60",
  "bg-amber-500/60",
  "bg-rose-500/60",
  "bg-indigo-500/60",
  "bg-teal-500/60",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarClient({ tasks, projects, sprints }: CalendarClientProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);

  const projectMap = useMemo(() => {
    const map: Record<string, SimpleProject> = {};
    projects.forEach(p => { map[p.id] = p; });
    return map;
  }, [projects]);

  // Build tasks-by-date map
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach(task => {
      const dateStr = task.due_date || task.committed_date;
      if (!dateStr) return;
      const key = dateStr.split("T")[0]; // normalize to YYYY-MM-DD
      if (!map[key]) map[key] = [];
      map[key].push(task);
    });
    return map;
  }, [tasks]);

  // Build project milestones (target_date)
  const milestones = useMemo(() => {
    return projects
      .filter(p => p.target_date)
      .map(p => ({ date: p.target_date!, name: p.name, projectId: p.id }));
  }, [projects]);

  // Calendar grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  // Sprints visible in this month
  const visibleSprints = useMemo(() => {
    return sprints.filter(sprint => {
      if (!sprint.started_at || !sprint.planned_end_at) return false;
      const sprintStart = parseISO(sprint.started_at);
      const sprintEnd = parseISO(sprint.planned_end_at);
      // Overlaps with the visible calendar range
      return sprintStart <= calEnd && sprintEnd >= calStart;
    });
  }, [sprints, calStart, calEnd]);

  // Tasks for selected date
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return tasksByDate[key] || [];
  }, [selectedDate, tasksByDate]);

  // Milestones for selected date
  const selectedDateMilestones = useMemo(() => {
    if (!selectedDate) return [];
    return milestones.filter(m => isSameDay(parseISO(m.date), selectedDate));
  }, [selectedDate, milestones]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskSheetOpen(true);
  };

  const prevMonth = () => setCurrentDate(d => subMonths(d, 1));
  const nextMonth = () => setCurrentDate(d => addMonths(d, 1));
  const goToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center px-6 bg-card/40 backdrop-blur-sm shrink-0">
        <CalendarDays className="w-5 h-5 text-primary mr-3" />
        <span className="text-sm font-bold text-foreground">Calendar</span>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={goToday}
            className="text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            Today
          </button>
          <button onClick={prevMonth} className="p-1.5 hover:bg-accent rounded-lg transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-sm font-semibold min-w-[140px] text-center">
            {format(currentDate, "MMMM yyyy")}
          </span>
          <button onClick={nextMonth} className="p-1.5 hover:bg-accent rounded-lg transition-colors">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 fade-in">
        {/* Calendar Grid */}
        <div className="glass-card p-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map(day => (
              <div key={day} className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {calDays.map(day => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayTasks = tasksByDate[dateKey] || [];
              const dayMilestones = milestones.filter(m => isSameDay(parseISO(m.date), day));
              const inMonth = isSameMonth(day, currentDate);
              const today = isToday(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const hasOverdue = dayTasks.some(t => t.status !== "Done" && isPast(day) && !isToday(day));

              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "relative min-h-[72px] p-1.5 rounded-lg text-left transition-all border",
                    inMonth ? "bg-card/60" : "bg-card/20",
                    isSelected ? "border-primary ring-1 ring-primary/30" : "border-transparent hover:border-border",
                    today && !isSelected && "border-primary/30",
                    hasOverdue && !isSelected && "bg-red-500/5",
                  )}
                >
                  {/* Day number */}
                  <span className={cn(
                    "text-xs font-medium block",
                    !inMonth && "text-muted-foreground/30",
                    today && "text-primary font-bold",
                    isSelected && "text-primary",
                  )}>
                    {format(day, "d")}
                  </span>

                  {/* Task chips */}
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    {dayTasks.slice(0, 3).map(task => (
                      <div
                        key={task.id}
                        className={cn(
                          "w-full h-1.5 rounded-full",
                          statusColor[task.status] || "bg-muted-foreground"
                        )}
                        title={task.title}
                      />
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="text-[8px] text-muted-foreground/60 leading-none">+{dayTasks.length - 3}</span>
                    )}
                  </div>

                  {/* Milestone marker */}
                  {dayMilestones.length > 0 && (
                    <Diamond className="w-2.5 h-2.5 text-amber-500 fill-amber-500 absolute top-1 right-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sprint Timeline Bars */}
        {visibleSprints.length > 0 && (
          <div className="glass-card p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sprint Timelines</h3>
            <div className="space-y-2">
              {visibleSprints.map((sprint, idx) => {
                const sprintStart = parseISO(sprint.started_at!);
                const sprintEnd = parseISO(sprint.planned_end_at!);
                const totalDays = differenceInDays(calEnd, calStart) + 1;
                const offsetDays = Math.max(0, differenceInDays(sprintStart, calStart));
                const durationDays = Math.min(
                  differenceInDays(sprintEnd, sprintStart) + 1,
                  totalDays - offsetDays
                );
                const leftPct = (offsetDays / totalDays) * 100;
                const widthPct = (durationDays / totalDays) * 100;
                const projectName = projectMap[sprint.project_id]?.name || "Unknown";
                const colorClass = sprintColors[idx % sprintColors.length];

                return (
                  <div key={sprint.id} className="relative h-7">
                    <div
                      className={cn("absolute top-0 h-full rounded-md flex items-center px-2 text-[10px] font-medium text-white truncate", colorClass)}
                      style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 3)}%` }}
                      title={`Sprint ${sprint.sprint_number}: ${sprint.goal || "No goal"} (${projectName})`}
                    >
                      S{sprint.sprint_number}: {sprint.goal || projectName}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Day Panel */}
        {selectedDate && (
          <div className="glass-card p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <CalendarDays className="w-3.5 h-3.5" />
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
              {selectedDateTasks.length > 0 && (
                <span className="text-muted-foreground/60">
                  — {selectedDateTasks.length} task{selectedDateTasks.length !== 1 ? "s" : ""} due
                </span>
              )}
            </h3>

            {/* Milestones for this day */}
            {selectedDateMilestones.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {selectedDateMilestones.map(m => (
                  <div key={m.projectId} className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <Diamond className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-medium text-amber-600">{m.name} — Target Date</span>
                  </div>
                ))}
              </div>
            )}

            {selectedDateTasks.length === 0 && selectedDateMilestones.length === 0 && (
              <p className="text-sm text-muted-foreground/50 py-3 text-center">Nothing scheduled for this day.</p>
            )}

            {selectedDateTasks.length > 0 && (
              <div className="space-y-1.5">
                {selectedDateTasks.map(task => {
                  const Icon = statusIcon[task.status] ?? Circle;
                  const projectName = task.project_id ? (projectMap[task.project_id]?.name || "Unknown") : "Personal";

                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-accent/15 hover:bg-accent/25 transition-colors cursor-pointer"
                      onClick={() => handleTaskClick(task)}
                    >
                      <Icon className={cn("w-4 h-4 shrink-0", {
                        "text-muted-foreground": task.status === "Todo",
                        "text-blue-500": task.status === "In Progress",
                        "text-emerald-500": task.status === "Done",
                        "text-red-500": task.status === "Blocked",
                      })} />
                      <span className="text-sm font-medium text-foreground flex-1 truncate">{task.title}</span>
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground shrink-0">{projectName}</span>
                      <span className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded shrink-0",
                        task.priority === "Critical" ? "text-red-500 bg-red-500/10" :
                        task.priority === "High" ? "text-amber-500 bg-amber-500/10" :
                        task.priority === "Medium" ? "text-blue-500 bg-blue-500/10" :
                        "text-muted-foreground bg-muted"
                      )}>
                        {task.priority}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
