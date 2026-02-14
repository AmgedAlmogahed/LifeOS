"use client";

import { useState } from "react";
import Link from "next/link";
import type { Project, Task, ProjectAsset, Lifecycle, Client, LifecycleStage } from "@/types/database";
import {
  ArrowLeft, CheckCircle2, Clock, AlertTriangle, Circle, ExternalLink,
  Github, Figma, Database, FileText, ListChecks, Lock, Unlock, XCircle, Play,
} from "lucide-react";
import { TaskDetailSheet } from "@/components/features/tasks/TaskDetailSheet";

const stageOrder: LifecycleStage[] = ["Requirements", "Building", "Testing", "Deploying", "Maintenance"];
const stageIcon: Record<string, string> = { Requirements: "\u{1F4CB}", Building: "\u{1F528}", Testing: "\u{1F9EA}", Deploying: "\u{1F680}", Maintenance: "\u{1F527}" };
const statusIcon = { "Todo": Circle, "In Progress": Clock, "Done": CheckCircle2, "Blocked": AlertTriangle, "Cancelled": XCircle };
const statusColor = { "Todo": "text-muted-foreground", "In Progress": "text-primary", "Done": "text-emerald-400", "Blocked": "text-red-400", "Cancelled": "text-muted-foreground/50" };
const priorityColor = { Critical: "text-red-400 bg-red-400/10", High: "text-amber-400 bg-amber-400/10", Medium: "text-blue-400 bg-blue-400/10", Low: "text-muted-foreground bg-accent" };
const assetIcons: Record<string, React.ReactNode> = {
  github: <Github className="w-4 h-4" />, figma: <Figma className="w-4 h-4" />,
  supabase: <Database className="w-4 h-4" />, docs: <FileText className="w-4 h-4" />, other: <ExternalLink className="w-4 h-4" />,
};

export function ForgeDetail({
  project, tasks, assets, lifecycle, client,
}: {
  project: Project; tasks: Task[]; assets: ProjectAsset[]; lifecycle: Lifecycle | null; client: { id: string; name: string; brand_primary: string } | null;
}) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);

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

        {/* ─── Tasks ───────────────────────────────────────────── */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <ListChecks className="w-3.5 h-3.5" /> Tasks
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
                    <span className="text-[10px] text-muted-foreground">{t.type}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
