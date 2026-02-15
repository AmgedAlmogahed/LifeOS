"use client";

import { useState } from "react";
import Link from "next/link";
import type { Project, Task, ProjectAsset, Lifecycle, Client, LifecycleStage, ProjectPhase, ProjectModule, WorkType } from "@/types/database";
import {
  ArrowLeft, CheckCircle2, Clock, AlertTriangle, Circle, ExternalLink,
  Github, Figma, Database, FileText, ListChecks, Lock, Unlock, XCircle, Play, Layers, LayoutGrid,
} from "lucide-react";
import { TaskDetailSheet } from "@/components/features/tasks/TaskDetailSheet";

const stageOrder: LifecycleStage[] = ["Requirements", "Building", "Testing", "Deploying", "Maintenance"];
const stageIcon: Record<string, string> = { Requirements: "📋", Building: "🔨", Testing: "🧪", Deploying: "🚀", Maintenance: "🔧" };
const statusIcon = { "Todo": Circle, "In Progress": Clock, "Done": CheckCircle2, "Blocked": AlertTriangle, "Cancelled": XCircle };
const statusColor = { "Todo": "text-muted-foreground", "In Progress": "text-primary", "Done": "text-emerald-400", "Blocked": "text-red-400", "Cancelled": "text-muted-foreground/50" };
const priorityColor = { Critical: "text-red-400 bg-red-400/10", High: "text-amber-400 bg-amber-400/10", Medium: "text-blue-400 bg-blue-400/10", Low: "text-muted-foreground bg-accent" };
const assetIcons: Record<string, React.ReactNode> = {
  github: <Github className="w-4 h-4" />, figma: <Figma className="w-4 h-4" />,
  supabase: <Database className="w-4 h-4" />, docs: <FileText className="w-4 h-4" />, other: <ExternalLink className="w-4 h-4" />,
};

const workTypes: WorkType[] = ["Frontend", "Backend", "Integration", "Testing", "Deployment", "Design", "Audit", "DevOps"];

export function ForgeDetail({
  project, tasks, assets, lifecycle, client, phases, modules,
}: {
  project: Project; tasks: Task[]; assets: ProjectAsset[]; lifecycle: Lifecycle | null; client: { id: string; name: string; brand_primary: string } | null;
  phases: ProjectPhase[]; modules: ProjectModule[];
}) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"tasks" | "matrix">("matrix");

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskSheetOpen(true);
  };

  const todoTasks = tasks.filter((t) => t.status === "Todo");
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress");
  const doneTasks = tasks.filter((t) => t.status === "Done");
  const blockedTasks = tasks.filter((t) => t.status === "Blocked");

  return (
    <div className="flex flex-col h-full">
      {/* ─── Top Bar ────────────────────────────────────────────── */}
      <div className="h-14 border-b border-border flex items-center px-6 bg-card/40 backdrop-blur-sm shrink-0">
        <Link href="/forge" className="mr-3 p-1.5 hover:bg-accent rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </Link>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border border-border/30 mr-3"
          style={client ? { background: `${client.brand_primary}18`, color: client.brand_primary } : { background: "oklch(0.20 0.01 285)", color: "oklch(0.7 0.19 265)" }}>
          {project.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <span className="text-sm font-bold text-foreground">{project.name}</span>
          <span className="block text-[10px] text-muted-foreground">
            {client ? client.name : "Unlinked"} · {project.service_type ?? "\u2014"}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {project.is_frozen ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 bg-cyan-400/10 px-2.5 py-1 rounded-lg">
              <Lock className="w-3 h-3" /> Frozen
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Unlock className="w-3 h-3" /> Editable
            </span>
          )}
          <span className={`text-xs font-semibold phase-${project.status?.toLowerCase()}`}>{project.status}</span>

          {/* Enter Focus button */}
          <Link
            href={`/focus/${project.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Play className="w-3.5 h-3.5" /> Enter Focus
          </Link>
        </div>
      </div>

      {/* ─── Content ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 fade-in">

        {/* ─── Lifecycle Pipeline ────────────────────────────────── */}
        {lifecycle && (
          <div className="glass-card p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Lifecycle</h2>
            <div className="flex items-center gap-2">
              {stageOrder.map((stage, i) => {
                const isCurrent = lifecycle.current_stage === stage;
                const idx = stageOrder.indexOf(lifecycle.current_stage);
                const isPast = i < idx;
                return (
                  <div key={stage} className="flex items-center gap-2 flex-1">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border flex-1 transition-all ${
                      isCurrent ? "bg-primary/12 border-primary/30 shadow-sm shadow-primary/10" :
                      isPast ? "bg-accent/40 border-border/30" : "bg-accent/15 border-border/20"
                    }`}>
                      <span className="text-sm">{stageIcon[stage]}</span>
                      <span className={`text-xs font-medium ${isCurrent ? "text-primary" : isPast ? "text-foreground/60" : "text-muted-foreground/40"}`}>
                        {stage}
                      </span>
                    </div>
                    {i < stageOrder.length - 1 && (
                      <div className={`w-4 h-px shrink-0 ${isPast || isCurrent ? "bg-primary/30" : "bg-border/30"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Progress + Specs row ────────────────────────────── */}
        <div className="grid grid-cols-3 gap-5">
          {/* Progress */}
          <div className="glass-card p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Progress</h2>
            <div className="text-3xl font-bold text-foreground mb-2">{project.progress}%</div>
            <div className="h-2 bg-accent rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-chart-3 transition-all" style={{ width: `${project.progress}%` }} />
            </div>
            <div className="grid grid-cols-4 gap-2 mt-4">
              {[
                { label: "Todo", count: todoTasks.length, color: "text-muted-foreground" },
                { label: "Active", count: inProgressTasks.length, color: "text-primary" },
                { label: "Done", count: doneTasks.length, color: "text-emerald-400" },
                { label: "Blocked", count: blockedTasks.length, color: "text-red-400" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className={`text-lg font-bold ${s.color}`}>{s.count}</div>
                  <div className="text-[10px] text-muted-foreground/50">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Specs */}
          <div className="col-span-2 glass-card p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Specs & Architecture</h2>
            {project.specs_md ? (
              <pre className="text-xs text-foreground/80 whitespace-pre-wrap data-mono max-h-48 overflow-y-auto">{project.specs_md}</pre>
            ) : (
              <p className="text-xs text-muted-foreground/50 py-4">No specs documented yet.</p>
            )}
          </div>
        </div>

        {/* ─── Assets ──────────────────────────────────────────── */}
        {assets.length > 0 && (
          <div className="glass-card p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Asset Repository</h2>
            <div className="grid grid-cols-4 gap-3">
              {assets.map((a) => (
                <a key={a.id} href={a.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-accent/20 hover:bg-accent/35 transition-colors">
                  <span className="text-muted-foreground">{assetIcons[a.asset_type] ?? assetIcons.other}</span>
                  <span className="text-xs font-medium text-foreground truncate">{a.label}</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ─── Tabs ───────────────────────────────────────────── */}
        <div className="flex items-center gap-1 p-1 bg-accent/20 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("matrix")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "matrix" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Module Matrix
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "tasks" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" /> Task View
          </button>
        </div>

        {activeTab === "matrix" ? (
          <div className="space-y-6">
            {phases.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Layers className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No phases or modules defined yet.</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Start planning to see the matrix view.</p>
              </div>
            ) : (
              phases.map((phase) => {
                const phaseModules = modules.filter(m => m.phase_id === phase.id);
                return (
                  <div key={phase.id} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase">
                        {phase.name}
                      </div>
                      <div className="h-px flex-1 bg-border/30" />
                      <span className="text-[10px] text-muted-foreground">
                        {phase.start_date} — {phase.end_date}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {phaseModules.map((module) => (
                        <div key={module.id} className="glass-card p-4 flex flex-col">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-foreground">{module.name}</h3>
                            <span className="text-[10px] font-mono text-muted-foreground">{module.progress}%</span>
                          </div>
                          
                          <div className="space-y-2 flex-1">
                            {workTypes.map(type => {
                              const moduleTasks = tasks.filter(t => t.module_id === module.id && t.work_type === type);
                              if (moduleTasks.length === 0) return null;
                              
                              const doneCount = moduleTasks.filter(t => t.status === "Done").length;
                              const isComplete = doneCount === moduleTasks.length;

                              return (
                                <div key={type} className="flex flex-col gap-1">
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-muted-foreground font-medium">{type}</span>
                                    <span className={isComplete ? "text-emerald-400" : "text-primary"}>
                                      {doneCount}/{moduleTasks.length}
                                    </span>
                                  </div>
                                  <div className="flex gap-1">
                                    {moduleTasks.map(t => (
                                      <div 
                                        key={t.id} 
                                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                                          t.status === "Done" ? "bg-emerald-400" : 
                                          t.status === "In Progress" ? "bg-primary" : 
                                          t.status === "Blocked" ? "bg-red-400" : "bg-accent"
                                        }`}
                                        title={t.title}
                                      />
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between">
                            <span className="text-[9px] text-muted-foreground">
                              {module.start_date ? new Date(module.start_date).toLocaleDateString() : "No date"}
                            </span>
                            <button className="text-[9px] font-bold text-primary hover:underline">
                              DETAILS
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* ─── Tasks ───────────────────────────────────────────── */
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <ListChecks className="w-3.5 h-3.5" /> All Tasks
              </h2>
              <span className="text-xs text-muted-foreground">{tasks.length} total</span>
            </div>
            {tasks.length === 0 ? (
              <p className="text-xs text-muted-foreground/50 py-4 text-center">No tasks yet.</p>
            ) : (
              <div className="space-y-1.5">
                {tasks.map((t) => {
                  const Icon = statusIcon[t.status] ?? Circle;
                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-accent/15 hover:bg-accent/25 transition-colors cursor-pointer"
                      onClick={() => handleTaskClick(t)}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${statusColor[t.status] ?? ""}`} />
                      <span className="text-sm font-medium text-foreground flex-1 truncate">{t.title}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${priorityColor[t.priority] ?? ""}`}>
                        {t.priority}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {t.work_type || t.type}
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
        projectName={project.name}
      />
    </div>
  );
}
