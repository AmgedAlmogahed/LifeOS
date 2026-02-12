"use client";

import { useState } from "react";
import type { AgentReport, AuditLog, Client, Project } from "@/types/database";
import { Bot, Shield, AlertTriangle, CheckCircle2, Clock, Terminal } from "lucide-react";

function timeAgo(ts: string) {
  const d = Date.now() - new Date(ts).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const severityStyle: Record<string, { icon: typeof AlertTriangle; cls: string; bg: string }> = {
  critical: { icon: AlertTriangle, cls: "level-critical", bg: "level-bg-critical" },
  warning: { icon: Clock, cls: "level-warning", bg: "level-bg-warning" },
  info: { icon: Shield, cls: "level-info", bg: "level-bg-info" },
};

export function AgentTerminal({ reports, auditLogs, clients, projects }: {
  reports: AgentReport[]; auditLogs: AuditLog[]; clients: Pick<Client, "id" | "name">[]; projects: Pick<Project, "id" | "name">[];
}) {
  const [tab, setTab] = useState<"reports" | "audit">("reports");
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");
  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]));
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  const openReports = reports.filter((r) => !r.is_resolved);
  const filteredReports = filter === "all" ? reports : filter === "open" ? reports.filter((r) => !r.is_resolved) : reports.filter((r) => r.is_resolved);

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-border flex items-center px-6 bg-card/40 backdrop-blur-sm shrink-0 gap-4">
        <Bot className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-foreground">Agent Terminal</span>
        <span className="text-xs text-muted-foreground">Son of Anton</span>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 status-blink" />
            <span className="text-[11px] text-emerald-500/80">Online</span>
          </div>
          {openReports.length > 0 && (
            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">
              {openReports.length} open
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 fade-in">
        {/* ─── Tab + Filter ────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <div className="flex gap-1 p-1 bg-accent/30 rounded-lg">
            {(["reports", "audit"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {t === "reports" ? "Reports" : "Audit Log"}
              </button>
            ))}
          </div>
          {tab === "reports" && (
            <div className="flex gap-1 p-1 bg-accent/30 rounded-lg">
              {(["all", "open", "resolved"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-md text-[10px] font-medium transition-all ${filter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── Agent Reports ──────────────────────────────────── */}
        {tab === "reports" && (
          <div className="space-y-2.5">
            {filteredReports.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Bot className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No agent reports.</p>
              </div>
            ) : filteredReports.map((r) => {
              const sev = severityStyle[r.severity] ?? severityStyle.info;
              const SevIcon = sev.icon;
              return (
                <div key={r.id} className={`glass-card p-5 border-l-3 ${r.is_resolved ? "opacity-60" : ""}`}
                  style={{ borderLeftWidth: "3px", borderLeftColor: r.severity === "critical" ? "oklch(0.63 0.24 25)" : r.severity === "warning" ? "oklch(0.78 0.14 80)" : "oklch(0.5 0.01 285)" }}>
                  <div className="flex items-center gap-3 mb-2">
                    <SevIcon className={`w-4 h-4 ${sev.cls}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${sev.cls}`}>{r.severity}</span>
                    <span className="text-[10px] text-muted-foreground/40">{r.report_type}</span>
                    <span className="text-[10px] text-muted-foreground/40 ml-auto">{timeAgo(r.created_at)}</span>
                    {r.is_resolved ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">OPEN</span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{r.title}</h3>
                  {r.body && <p className="text-xs text-muted-foreground/70 mt-1.5 leading-relaxed">{r.body}</p>}
                  <div className="flex items-center gap-3 mt-2.5">
                    {r.client_id && <span className="text-[10px] text-muted-foreground/50">Client: {clientMap[r.client_id] ?? "—"}</span>}
                    {r.project_id && <span className="text-[10px] text-muted-foreground/50">Project: {projectMap[r.project_id] ?? "—"}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Audit Log ──────────────────────────────────────── */}
        {tab === "audit" && (
          <div className="glass-card p-5">
            <div className="space-y-0.5 data-mono">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">No audit logs.</p>
              ) : auditLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 py-2 px-2 rounded hover:bg-accent/15 transition-colors">
                  <span className="text-[10px] text-muted-foreground/40 shrink-0 w-12">{timeAgo(log.timestamp)}</span>
                  <span className={`text-[10px] font-bold w-14 shrink-0 uppercase ${
                    log.level === "Critical" ? "level-critical" : log.level === "Warning" ? "level-warning" : "level-info"
                  }`}>{log.level}</span>
                  <span className="text-xs text-foreground/80 flex-1">{log.message}</span>
                  <span className="text-[10px] text-muted-foreground/30">{log.source}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
