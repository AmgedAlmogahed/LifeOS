"use client";

import { useState } from "react";
import Link from "next/link";
import type { Project } from "@/types/database";
import { FolderKanban, ArrowRight, Search, Lock } from "lucide-react";

const phaseStyles: Record<string, { css: string; bg: string; border: string }> = {
  Understand: { css: "phase-understand", bg: "phase-bg-understand", border: "phase-border-understand" },
  Document:   { css: "phase-document",   bg: "phase-bg-document",   border: "phase-border-document" },
  Freeze:     { css: "phase-freeze",     bg: "phase-bg-freeze",     border: "phase-border-freeze" },
  Implement:  { css: "phase-implement",  bg: "phase-bg-implement",  border: "phase-border-implement" },
  Verify:     { css: "phase-verify",     bg: "phase-bg-verify",     border: "phase-border-verify" },
};

export function ProjectList({ projects }: { projects: Project[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = projects.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-border flex items-center px-6 bg-card/50 backdrop-blur-sm shrink-0 gap-4">
        <FolderKanban className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Project Forge</span>
        <span className="text-xs text-muted-foreground">{filtered.length} projects</span>

        <div className="ml-auto flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="h-8 pl-9 pr-3 bg-accent border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 w-48 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 bg-accent border border-border rounded-lg text-sm text-foreground px-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">All Phases</option>
            {["Understand", "Document", "Freeze", "Implement", "Verify"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <FolderKanban className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No projects found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((project) => {
              const phase = phaseStyles[project.status] ?? phaseStyles.Understand;
              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="glass-card p-5 cursor-pointer group">
                    <div className="flex items-start gap-3.5 mb-4">
                      <div className={`phase-ring ${phase.bg} border ${phase.border}`}>
                        <span className={`text-xs font-bold ${phase.css}`}>{project.progress}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {project.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[11px] font-semibold uppercase tracking-wider ${phase.css}`}>
                            {project.status}
                          </span>
                          {project.is_frozen && (
                            <Lock className="w-3 h-3 phase-freeze" />
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${phase.bg}`} style={{ width: `${project.progress}%`, opacity: 0.8 }} />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{project.progress}%</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
