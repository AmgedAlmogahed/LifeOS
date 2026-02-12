"use client";

import { ProjectCard } from "@/components/dashboard/project-card";
import { GuardianFeed } from "@/components/dashboard/guardian-feed";
import { SystemStatus } from "@/components/dashboard/system-status";
import { StatsCard } from "@/components/dashboard/stats-card";
import type { Project, AuditLog, Task, SystemConfig } from "@/types/database";
import {
  FolderKanban,
  CheckSquare,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

interface DashboardClientProps {
  projects: Project[];
  logs: AuditLog[];
  tasks: Task[];
  config: SystemConfig[];
}

export function DashboardClient({
  projects,
  logs,
  tasks,
}: DashboardClientProps) {
  const totalProjects = projects.length;
  const activeTasks = tasks.filter((t) => t.status !== "Done").length;
  const criticalAlerts = logs.filter((l) => l.level === "Critical").length;
  const avgProgress =
    projects.length > 0
      ? Math.round(
          projects.reduce((acc, p) => acc + p.progress, 0) / projects.length
        )
      : 0;

  // Determine agent status from most recent log
  const lastLog = logs[0];
  const agentStatus = lastLog
    ? new Date().getTime() - new Date(lastLog.timestamp).getTime() < 600000
      ? "online"
      : "offline"
    : "offline";

  return (
    <div className="space-y-6">
      {/* ─── Page Header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Command Center
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Real-time overview of all projects, tasks, and system operations.
        </p>
      </div>

      {/* ─── System Status ────────────────────────────────────────────────── */}
      <SystemStatus
        status={agentStatus as "online" | "syncing" | "offline"}
        lastSync={lastLog?.timestamp ?? null}
      />

      {/* ─── Stats Grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Projects"
          value={totalProjects}
          subtitle={`${projects.filter((p) => p.status === "Implement").length} in progress`}
          icon={FolderKanban}
          color="blue"
        />
        <StatsCard
          title="Active Tasks"
          value={activeTasks}
          subtitle={`${tasks.filter((t) => t.priority === "Critical").length} critical`}
          icon={CheckSquare}
          color="violet"
        />
        <StatsCard
          title="Avg. Progress"
          value={`${avgProgress}%`}
          icon={TrendingUp}
          color="emerald"
        />
        <StatsCard
          title="Critical Alerts"
          value={criticalAlerts}
          subtitle="Requires attention"
          icon={AlertTriangle}
          color={criticalAlerts > 0 ? "red" : "emerald"}
        />
      </div>

      {/* ─── Main Content Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Cards — 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-300">
              Project Overview
            </h2>
            <span className="text-xs text-zinc-600 font-mono">
              {totalProjects} total
            </span>
          </div>
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
              <FolderKanban className="w-12 h-12 mb-3 text-zinc-700" />
              <p className="text-sm font-medium">No projects yet</p>
              <p className="text-xs text-zinc-700 mt-1">
                Create your first project to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>

        {/* Guardian Feed — 1/3 width */}
        <div>
          <GuardianFeed logs={logs} />
        </div>
      </div>
    </div>
  );
}
