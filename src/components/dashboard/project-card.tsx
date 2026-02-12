"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Project, ProjectStatus } from "@/types/database";
import {
  FolderKanban,
  Clock,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

const statusConfig: Record<
  ProjectStatus,
  { color: string; bg: string; glow: string }
> = {
  Backlog: {
    color: "text-zinc-400",
    bg: "bg-zinc-500/10",
    glow: "shadow-zinc-500/5",
  },
  Understand: {
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    glow: "shadow-amber-500/5",
  },
  Document: {
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    glow: "shadow-blue-500/5",
  },
  Freeze: {
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    glow: "shadow-cyan-500/5",
  },
  Implement: {
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    glow: "shadow-violet-500/5",
  },
  Verify: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    glow: "shadow-emerald-500/5",
  },
};

function getProgressColor(progress: number): string {
  if (progress >= 80) return "bg-emerald-500";
  if (progress >= 50) return "bg-blue-500";
  if (progress >= 25) return "bg-amber-500";
  return "bg-zinc-500";
}

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const config = statusConfig[project.status];
  const lastAudit = project.last_audit_at
    ? new Date(project.last_audit_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Never";

  return (
    <Link href={`/projects/${project.id}`}>
      <Card
        className={`group bg-zinc-900/60 backdrop-blur-sm border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 hover:shadow-xl ${config.glow} cursor-pointer overflow-hidden relative`}
      >
        {/* Subtle top gradient accent */}
        <div
          className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${
            project.progress >= 80
              ? "from-emerald-500/60 to-emerald-500/0"
              : project.progress >= 50
              ? "from-blue-500/60 to-blue-500/0"
              : "from-zinc-500/30 to-transparent"
          }`}
        />

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${config.bg} transition-transform group-hover:scale-110`}
              >
                <FolderKanban className={`w-4 h-4 ${config.color}`} />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-white group-hover:text-blue-100 transition-colors">
                  {project.name}
                </CardTitle>
                <Badge
                  variant="outline"
                  className={`mt-1 text-[10px] ${config.color} border-current/20 ${config.bg}`}
                >
                  {project.status}
                </Badge>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" />
                Progress
              </span>
              <span className="text-xs font-mono font-bold text-zinc-300">
                {project.progress}%
              </span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${getProgressColor(
                  project.progress
                )}`}
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>

          {/* Last Audit */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Clock className="w-3 h-3" />
            <span>Last audit: {lastAudit}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
