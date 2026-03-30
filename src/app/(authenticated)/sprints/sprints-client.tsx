"use client";

import { useState } from "react";
import { Repeat, Target, Clock, CheckCircle2 } from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-500",
  planned: "bg-blue-500/10 text-blue-500",
  completed: "bg-muted text-muted-foreground",
};

export function SprintsClient({
  sprints,
  projects,
}: {
  sprints: any[];
  projects: any[];
}) {
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = sprints.filter((s) => {
    if (projectFilter !== "all" && s.project_id !== projectFilter) return false;
    if (statusFilter !== "all" && s.status?.toLowerCase() !== statusFilter) return false;
    return true;
  });

  const activeSprints = sprints.filter((s) => s.status?.toLowerCase() === "active");
  const completedSprints = sprints.filter((s) => s.status?.toLowerCase() === "completed");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center px-6 bg-card/40 backdrop-blur-sm shrink-0 gap-4">
        <Repeat className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-foreground">Sprints</span>
        <span className="text-xs text-muted-foreground">Global Sprint View</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5 fade-in">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-emerald-500" />
              <span className="text-[11px] text-muted-foreground">Active Sprints</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{activeSprints.length}</div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-[11px] text-muted-foreground">Total Sprints</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{sprints.length}</div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">Completed</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{completedSprints.length}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="text-xs bg-accent/20 border border-border rounded-lg px-3 py-1.5 text-foreground"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div className="flex gap-1 p-0.5 bg-accent/30 rounded-lg">
            {["all", "active", "planned", "completed"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                  statusFilter === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
        </div>

        {/* Sprint cards */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Repeat className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No sprints found.</p>
            </div>
          ) : (
            filtered.map((sprint) => {
              const progress = sprint.progress ?? 0;
              const statusKey = sprint.status?.toLowerCase() ?? "planned";
              return (
                <div key={sprint.id} className="glass-card p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{sprint.name || `Sprint ${sprint.sprint_number ?? ""}`}</h3>
                      <span className="text-[10px] text-muted-foreground/60">
                        {sprint.projects?.name ?? "Unknown Project"}
                      </span>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${statusColors[statusKey] ?? statusColors.planned}`}>
                      {sprint.status ?? "Planned"}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1 h-1.5 bg-accent/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground w-8 text-right">{progress}%</span>
                  </div>
                  {/* Dates */}
                  {(sprint.start_date || sprint.end_date) && (
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground/50">
                      {sprint.start_date && <span>Start: {new Date(sprint.start_date).toLocaleDateString()}</span>}
                      {sprint.end_date && <span>End: {new Date(sprint.end_date).toLocaleDateString()}</span>}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
