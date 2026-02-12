"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Task, TaskStatus, TaskPriority } from "@/types/database";
import {
  CheckSquare,
  Search,
  Plus,
  Filter,
  Calendar,
  FolderKanban,
  Circle,
  CircleDot,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const statusIcons: Record<TaskStatus, React.ComponentType<{ className?: string }>> = {
  Todo: Circle,
  "In Progress": CircleDot,
  Done: CheckCircle2,
  Blocked: XCircle,
};

const statusColors: Record<TaskStatus, string> = {
  Todo: "text-zinc-400",
  "In Progress": "text-blue-400",
  Done: "text-emerald-400",
  Blocked: "text-red-400",
};

const priorityColors: Record<TaskPriority, string> = {
  Critical: "text-red-400 bg-red-500/10 border-red-500/20",
  High: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  Medium: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  Low: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
};

interface TasksClientProps {
  tasks: Task[];
  projects: { id: string; name: string }[];
}

export function TasksClient({ tasks, projects }: TasksClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

  const filtered = tasks.filter((t) => {
    const matchesSearch = t.title
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || t.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || t.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Tasks
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Track and manage all task assignments.
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-lg shadow-blue-500/20 border-0">
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-zinc-900/60 border-white/[0.06] text-white placeholder:text-zinc-600 h-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] bg-zinc-900/60 border-white/[0.06] text-zinc-300 h-10">
            <Filter className="w-4 h-4 mr-2 text-zinc-500" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-white/[0.06]">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Todo">Todo</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Done">Done</SelectItem>
            <SelectItem value="Blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[160px] bg-zinc-900/60 border-white/[0.06] text-zinc-300 h-10">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-white/[0.06]">
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
          <CheckSquare className="w-12 h-12 mb-3 text-zinc-700" />
          <p className="text-sm font-medium">No tasks found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => {
            const StatusIcon = statusIcons[task.status];
            const statusColor = statusColors[task.status];
            const priorityColor = priorityColors[task.priority];

            return (
              <Card
                key={task.id}
                className="bg-zinc-900/60 backdrop-blur-sm border-white/[0.06] hover:border-white/[0.12] transition-all duration-200 p-4 cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <StatusIcon className={`w-5 h-5 shrink-0 ${statusColor}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate group-hover:text-blue-100 transition-colors">
                        {task.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {projectMap.get(task.project_id) && (
                        <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                          <FolderKanban className="w-3 h-3" />
                          {projectMap.get(task.project_id)}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.due_date).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-[10px] shrink-0 ${priorityColor}`}
                  >
                    {task.priority}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[10px] shrink-0 ${statusColor} border-current/20 bg-current/5`}
                  >
                    {task.status}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
