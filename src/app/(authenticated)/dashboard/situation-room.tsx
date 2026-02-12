"use client";

import Link from "next/link";
import type {
  Project,
  AuditLog,
  Task,
  SystemConfig,
  LeverageLog,
} from "@/types/database";
import {
  AlertTriangle,
  Clock,
  Activity,
  Zap,
  ArrowRight,
  FolderKanban,
  ListChecks,
  Target,
  TrendingUp,
  Shield,
} from "lucide-react";

// ─── Phase Config ────────────────────────────────────────────────────────────

const phaseConfig: Record<string, { css: string; bg: string; border: string; label: string }> = {
  Understand: { css: "phase-understand", bg: "phase-bg-understand", border: "phase-border-understand", label: "Understand" },
  Document:   { css: "phase-document",   bg: "phase-bg-document",   border: "phase-border-document",   label: "Document" },
  Freeze:     { css: "phase-freeze",     bg: "phase-bg-freeze",     border: "phase-border-freeze",     label: "Freeze" },
  Implement:  { css: "phase-implement",  bg: "phase-bg-implement",  border: "phase-border-implement",  label: "Implement" },
  Verify:     { css: "phase-verify",     bg: "phase-bg-verify",     border: "phase-border-verify",     label: "Verify" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatTimestamp(ts: string) {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getNext24hDeadline(tasks: Task[]): Task | null {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return tasks.find((t) => {
    if (!t.due_date || t.status === "Done") return false;
    const due = new Date(t.due_date);
    return due >= now && due <= tomorrow;
  }) ?? null;
}

function getAgentStatus(config: SystemConfig[]): "online" | "syncing" | "offline" {
  const lastSync = config.find((c) => c.key === "last_agent_sync");
  if (!lastSync) return "offline";
  const val = typeof lastSync.value === "string" ? lastSync.value : JSON.stringify(lastSync.value);
  if (val === '"never"' || val === "never") return "offline";
  const syncTime = new Date(val.replace(/"/g, ""));
  const diff = Date.now() - syncTime.getTime();
  if (diff < 60000) return "syncing";
  if (diff < 600000) return "online";
  return "offline";
}

// ─── Component ───────────────────────────────────────────────────────────────

interface SituationRoomProps {
  projects: Project[];
  logs: AuditLog[];
  tasks: Task[];
  config: SystemConfig[];
  leverageLogs: LeverageLog[];
}

export function SituationRoom({ projects, logs, tasks, config, leverageLogs }: SituationRoomProps) {
  const nextDeadline = getNext24hDeadline(tasks);
  const agentStatus = getAgentStatus(config);
  const criticalLogs = logs.filter((l) => l.level === "Critical");
  const activeTasks = tasks.filter((t) => t.status !== "Done");
  const avgProgress = projects.length > 0
    ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length)
    : 0;
  const weekHoursSaved = leverageLogs
    .filter((l) => new Date(l.timestamp) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .reduce((s, l) => s + Number(l.hours_saved), 0);

  const statusStyles = {
    online: { dot: "bg-emerald-500", text: "text-emerald-400" },
    syncing: { dot: "bg-amber-500", text: "text-amber-400" },
    offline: { dot: "bg-red-500", text: "text-red-400" },
  };

  const focusProject = projects[0];

  return (
    <div className="flex flex-col h-full">
      {/* ═══ PULSE HEADER ═══════════════════════════════════════════════ */}
      <div className="h-14 border-b border-border flex items-center px-6 gap-6 bg-card/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <Target className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Focus</span>
          <span className="text-sm font-medium text-foreground">
            {focusProject?.name ?? "No projects"}
          </span>
        </div>

        <div className="w-px h-6 bg-border" />

        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">24h</span>
          <span className="text-sm text-foreground">
            {nextDeadline ? nextDeadline.title : "No deadlines"}
          </span>
        </div>

        <div className="w-px h-6 bg-border" />

        <div className="flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Agent</span>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${statusStyles[agentStatus].dot} ${agentStatus !== "offline" ? "status-blink" : ""}`} />
            <span className={`text-xs font-medium capitalize ${statusStyles[agentStatus].text}`}>
              {agentStatus}
            </span>
          </div>
        </div>

        {weekHoursSaved > 0 && (
          <>
            <div className="w-px h-6 bg-border" />
            <div className="flex items-center gap-2 ml-auto">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-amber-400">
                {weekHoursSaved.toFixed(1)}h saved
              </span>
            </div>
          </>
        )}
      </div>

      {/* ═══ MAIN CONTENT ═══════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden">
        {/* ─── Left: Heatmap + Stats ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats Strip */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard icon={<FolderKanban className="w-5 h-5 text-primary" />} label="Projects" value={projects.length.toString()} sub={`${avgProgress}% avg progress`} />
            <StatCard icon={<ListChecks className="w-5 h-5 text-emerald-500" />} label="Active Tasks" value={activeTasks.length.toString()} sub={`${tasks.filter((t) => t.status === "Done").length} completed`} />
            <StatCard icon={<Shield className="w-5 h-5 text-red-500" />} label="Critical Alerts" value={criticalLogs.length.toString()} sub="requires attention" alert={criticalLogs.length > 0} />
            <StatCard icon={<TrendingUp className="w-5 h-5 text-amber-500" />} label="Leverage" value={`${weekHoursSaved.toFixed(1)}h`} sub="saved this week" />
          </div>

          {/* Project Heatmap */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Project Heatmap</h2>
              <div className="flex items-center gap-4">
                {Object.entries(phaseConfig).map(([key, cfg]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${cfg.bg} border ${cfg.border}`} />
                    <span className="text-[11px] text-muted-foreground">{key}</span>
                  </div>
                ))}
              </div>
            </div>

            {projects.length === 0 ? (
              <div className="glass-card p-10 text-center">
                <FolderKanban className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No projects yet.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Create your first project in the Project Forge.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <ProjectHeatCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Right: Guardian Feed ─────────────────────────────────── */}
        <div className="w-[380px] border-l border-border bg-card/30 backdrop-blur-sm flex flex-col shrink-0">
          <div className="h-12 flex items-center px-5 border-b border-border">
            <Shield className="w-4 h-4 text-amber-500 mr-2" />
            <span className="text-sm font-semibold text-foreground">Guardian Feed</span>
            <span className="ml-auto text-xs text-muted-foreground">{logs.length} entries</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-muted-foreground">No guardian alerts yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {logs.map((log) => (
                  <div key={log.id} className="px-5 py-3 hover:bg-accent/30 transition-colors">
                    <div className="data-mono">
                      <span className="text-muted-foreground/60">
                        [{formatTimestamp(log.timestamp)}]
                      </span>{" "}
                      <span className={`font-semibold ${
                        log.level === "Critical" ? "level-critical" :
                        log.level === "Warning" ? "level-warning" : "level-info"
                      }`}>
                        {log.level.toUpperCase()}
                      </span>
                      <span className="text-muted-foreground/40">:</span>{" "}
                      <span className="text-foreground/90">{log.message}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground/50">
                      src: {log.source} · {timeAgo(log.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub Components ──────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, alert = false }: {
  icon: React.ReactNode; label: string; value: string; sub: string; alert?: boolean;
}) {
  return (
    <div className={`glass-card p-4 ${alert ? "border-red-500/30 glow-red" : ""}`}>
      <div className="flex items-center gap-2.5 mb-3">
        {icon}
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground/70 mt-1">{sub}</div>
    </div>
  );
}

function ProjectHeatCard({ project }: { project: Project }) {
  const phase = phaseConfig[project.status] ?? phaseConfig.Understand;

  return (
    <Link href={`/projects/${project.id}`}>
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
                {phase.label}
              </span>
              {project.is_frozen && (
                <span className="text-[10px] font-medium phase-freeze phase-bg-freeze px-1.5 py-0.5 rounded-md border phase-border-freeze">
                  Frozen
                </span>
              )}
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-accent rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${phase.bg}`}
            style={{ width: `${project.progress}%`, opacity: 0.8 }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-muted-foreground">{project.progress}%</span>
          {project.last_audit_at && (
            <span className="text-[11px] text-muted-foreground/50">{timeAgo(project.last_audit_at)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
