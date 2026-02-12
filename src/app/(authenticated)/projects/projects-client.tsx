"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Project, ProjectStatus } from "@/types/database";
import {
  FolderKanban,
  Search,
  Plus,
  Filter,
  Clock,
  TrendingUp,
} from "lucide-react";

const statusOptions: ProjectStatus[] = [
  "Backlog",
  "Understand",
  "Document",
  "Freeze",
  "Implement",
  "Verify",
];

const statusColors: Record<ProjectStatus, string> = {
  Backlog: "text-zinc-400 bg-zinc-500/10",
  Understand: "text-amber-400 bg-amber-500/10",
  Document: "text-blue-400 bg-blue-500/10",
  Freeze: "text-cyan-400 bg-cyan-500/10",
  Implement: "text-violet-400 bg-violet-500/10",
  Verify: "text-emerald-400 bg-emerald-500/10",
};

interface ProjectsClientProps {
  projects: Project[];
}

export function ProjectsClient({ projects }: ProjectsClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = projects.filter((p) => {
    const matchesSearch = p.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Projects
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage and track all project lifecycles.
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-lg shadow-blue-500/20 border-0">
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-zinc-900/60 border-white/[0.06] text-white placeholder:text-zinc-600 h-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-zinc-900/60 border-white/[0.06] text-zinc-300 h-10">
            <Filter className="w-4 h-4 mr-2 text-zinc-500" />
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-white/[0.06]">
            <SelectItem value="all">All Statuses</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
          <FolderKanban className="w-12 h-12 mb-3 text-zinc-700" />
          <p className="text-sm font-medium">No projects found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => {
            const colorClass = statusColors[project.status];
            return (
              <Card
                key={project.id}
                className="bg-zinc-900/60 backdrop-blur-sm border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 group cursor-pointer"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <FolderKanban className="w-4 h-4 text-blue-400" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-white">
                        {project.name}
                      </CardTitle>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${colorClass} border-current/20`}
                    >
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Progress
                      </span>
                      <span className="font-mono text-zinc-300">
                        {project.progress}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-700"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Clock className="w-3 h-3" />
                    <span>
                      Updated{" "}
                      {new Date(project.updated_at).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric" }
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
