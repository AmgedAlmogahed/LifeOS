"use client";

import { useState } from "react";
import type { Task } from "@/types/database";
import {
  Circle,
  CheckCircle2,
  AlertCircle,
  Pause,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  ListChecks,
  Bot,
} from "lucide-react";

const taskStatusIcon: Record<string, React.ReactNode> = {
  Todo: <Circle className="w-3.5 h-3.5 text-muted-foreground" />,
  "In Progress": <AlertCircle className="w-3.5 h-3.5 text-amber-500" />,
  Done: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
  Blocked: <Pause className="w-3.5 h-3.5 text-red-500" />,
};

const typeColors: Record<string, string> = {
  Architectural: "text-primary bg-primary/10 border-primary/20",
  Implementation: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  Audit: "level-warning level-bg-warning border-amber-500/20",
  Maintenance: "text-muted-foreground bg-accent border-border",
};

const priorityColors: Record<string, string> = {
  Critical: "level-critical",
  High: "text-amber-400",
  Medium: "text-primary",
  Low: "text-muted-foreground",
};

const statuses = ["Todo", "In Progress", "Done", "Blocked"] as const;
const types = ["Architectural", "Implementation", "Audit", "Maintenance"] as const;

interface LogicEngineProps {
  tasks: Task[];
  projects: { id: string; name: string }[];
}

export function LogicEngine({ tasks, projects }: LogicEngineProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  const filtered = tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    return true;
  });

  const grouped = {
    "In Progress": filtered.filter((t) => t.status === "In Progress"),
    Blocked: filtered.filter((t) => t.status === "Blocked"),
    Todo: filtered.filter((t) => t.status === "Todo"),
    Done: filtered.filter((t) => t.status === "Done"),
  };

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-border flex items-center px-6 bg-card/50 backdrop-blur-sm shrink-0 gap-4">
        <ListChecks className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Logic Engine</span>
        <span className="text-xs text-muted-foreground">{filtered.length} tasks</span>

        <div className="ml-auto flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="h-8 pl-9 pr-3 bg-accent border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 w-48 transition-all"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 bg-accent border border-border rounded-lg text-sm text-foreground px-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">All Status</option>
              {statuses.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 bg-accent border border-border rounded-lg text-sm text-foreground px-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">All Types</option>
            {types.map((t) => (<option key={t} value={t}>{t}</option>))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <ListChecks className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No tasks match your filters.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([status, statusTasks]) => {
              if (statusTasks.length === 0) return null;
              return (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-3">
                    {taskStatusIcon[status]}
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {status}
                    </span>
                    <span className="text-xs text-muted-foreground/60">({statusTasks.length})</span>
                  </div>

                  <div className="space-y-1.5">
                    {statusTasks.map((task) => {
                      const isExpanded = expandedTask === task.id;
                      const typeStyle = typeColors[task.type] ?? typeColors.Implementation;
                      return (
                        <div key={task.id} className="glass-card overflow-hidden">
                          <button
                            onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                            className="w-full p-3.5 flex items-center gap-3 text-left"
                          >
                            {taskStatusIcon[task.status]}
                            <span className="text-sm text-foreground truncate flex-1">{task.title}</span>
                            <span className="text-xs text-muted-foreground/60">{projectMap[task.project_id] ?? "—"}</span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${typeStyle}`}>
                              {task.type}
                            </span>
                            <span className={`text-xs font-medium ${priorityColors[task.priority]}`}>{task.priority}</span>
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="px-3.5 pb-3.5 border-t border-border/50">
                              <div className="mt-3 grid grid-cols-4 gap-3">
                                <InfoBlock label="Project" value={projectMap[task.project_id] ?? "—"} />
                                <InfoBlock label="Priority" value={task.priority} />
                                <InfoBlock label="Type" value={task.type} />
                                <InfoBlock label="Due" value={task.due_date ?? "—"} />
                              </div>

                              {task.agent_context && Object.keys(task.agent_context).length > 0 && (
                                <div className="mt-3">
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <Bot className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">Agent Context</span>
                                  </div>
                                  <pre className="data-mono text-foreground/70 bg-background rounded-lg p-3 overflow-x-auto border border-border/50 text-[11px]">
                                    {JSON.stringify(task.agent_context, null, 2)}
                                  </pre>
                                </div>
                              )}

                              {task.metadata && Object.keys(task.metadata).length > 0 && (
                                <div className="mt-3">
                                  <div className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider mb-1.5">Metadata</div>
                                  <pre className="data-mono text-foreground/70 bg-background rounded-lg p-3 overflow-x-auto border border-border/50 text-[11px]">
                                    {JSON.stringify(task.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card p-2.5">
      <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{label}</div>
      <div className="text-xs text-foreground mt-0.5">{value}</div>
    </div>
  );
}
