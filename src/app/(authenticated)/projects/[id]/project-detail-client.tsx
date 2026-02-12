"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project, Task, ProjectStatus, TaskStatus } from "@/types/database";
import {
  ArrowLeft,
  FolderKanban,
  TrendingUp,
  Clock,
  CheckSquare,
  Circle,
  CircleDot,
  CheckCircle2,
  XCircle,
  Calendar,
} from "lucide-react";
import Link from "next/link";

const statusColors: Record<ProjectStatus, string> = {
  Backlog: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
  Understand: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  Document: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  Freeze: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  Implement: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  Verify: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

const taskStatusIcons: Record<TaskStatus, React.ComponentType<{ className?: string }>> = {
  Todo: Circle,
  "In Progress": CircleDot,
  Done: CheckCircle2,
  Blocked: XCircle,
};

const taskStatusColors: Record<TaskStatus, string> = {
  Todo: "text-zinc-400",
  "In Progress": "text-blue-400",
  Done: "text-emerald-400",
  Blocked: "text-red-400",
};

interface ProjectDetailClientProps {
  project: Project;
  tasks: Task[];
}

export function ProjectDetailClient({
  project,
  tasks,
}: ProjectDetailClientProps) {
  const completedTasks = tasks.filter((t) => t.status === "Done").length;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/projects">
        <Button
          variant="ghost"
          className="text-zinc-400 hover:text-white -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>
      </Link>

      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-white/10">
            <FolderKanban className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {project.name}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge
                variant="outline"
                className={`text-xs ${statusColors[project.status]}`}
              >
                {project.status}
              </Badge>
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Updated{" "}
                {new Date(project.updated_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-zinc-900/60 border-white/[0.06]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-xs text-zinc-500">Progress</p>
                <p className="text-xl font-bold text-white">
                  {project.progress}%
                </p>
              </div>
            </div>
            <div className="mt-3 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-700"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/60 border-white/[0.06]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckSquare className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-xs text-zinc-500">Tasks Completed</p>
                <p className="text-xl font-bold text-white">
                  {completedTasks}
                  <span className="text-sm text-zinc-500 font-normal">
                    /{tasks.length}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/60 border-white/[0.06]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-xs text-zinc-500">Last Audit</p>
                <p className="text-sm font-medium text-white">
                  {project.last_audit_at
                    ? new Date(project.last_audit_at).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                      )
                    : "Never"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task List */}
      <Card className="bg-zinc-900/60 border-white/[0.06]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-white">
            Tasks ({tasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-zinc-600">
              <CheckSquare className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
              <p className="text-sm">No tasks yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => {
                const StatusIcon = taskStatusIcons[task.status];
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.02] transition-colors"
                  >
                    <StatusIcon
                      className={`w-4 h-4 ${taskStatusColors[task.status]}`}
                    />
                    <span className="text-sm text-zinc-200 flex-1 truncate">
                      {task.title}
                    </span>
                    {task.due_date && (
                      <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(task.due_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${taskStatusColors[task.status]} border-current/20`}
                    >
                      {task.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
