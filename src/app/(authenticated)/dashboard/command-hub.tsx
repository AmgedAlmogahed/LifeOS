"use client";

import Link from "next/link";
import type { Client, Opportunity, Contract, Project, Deployment, AgentReport, LeverageLog } from "@/types/database";
import {
  DollarSign, TrendingUp, Users, FolderKanban, Zap, AlertTriangle,
  ArrowRight, Bot, Rocket, Activity, Shield, Clock,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(ts: string) {
  const d = Date.now() - new Date(ts).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function currency(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}

const stageColors: Record<string, { css: string; bg: string }> = {
  Draft: { css: "stage-draft", bg: "stage-bg-draft" },
  "Price Offer Sent": { css: "stage-sent", bg: "stage-bg-sent" },
  Negotiating: { css: "stage-negotiating", bg: "stage-bg-negotiating" },
  Won: { css: "stage-won", bg: "stage-bg-won" },
  Lost: { css: "stage-lost", bg: "stage-bg-lost" },
};

const svcColors: Record<string, { css: string; bg: string; border: string }> = {
  Cloud: { css: "svc-cloud", bg: "svc-bg-cloud", border: "svc-border-cloud" },
  Web: { css: "svc-web", bg: "svc-bg-web", border: "svc-border-web" },
  Design: { css: "svc-design", bg: "svc-bg-design", border: "svc-border-design" },
  Marketing: { css: "svc-marketing", bg: "svc-bg-marketing", border: "svc-border-marketing" },
};

// ─── Component ───────────────────────────────────────────────────────────────

interface CommandHubProps {
  clients: Client[];
  opportunities: Opportunity[];
  contracts: Contract[];
  projects: Project[];
  deployments: Deployment[];
  agentReports: AgentReport[];
  leverageLogs: LeverageLog[];
}

export function CommandHub({
  clients, opportunities, contracts, projects, deployments, agentReports, leverageLogs,
}: CommandHubProps) {
  const activeContracts = contracts.filter((c) => c.status === "Active");
  const activeRevenue = activeContracts.reduce((s, c) => s + Number(c.total_value), 0);
  const pipelineOpps = opportunities.filter((o) => o.stage !== "Won" && o.stage !== "Lost");
  const pipelineRevenue = pipelineOpps.reduce((s, o) => s + Number(o.estimated_value) * (o.probability / 100), 0);
  const wonOpps = opportunities.filter((o) => o.stage === "Won");
  const totalWonValue = wonOpps.reduce((s, o) => s + Number(o.estimated_value), 0);
  const activeProjects = projects.filter((p) => p.status !== "Verify");
  const avgHealth = clients.length > 0 ? Math.round(clients.reduce((s, c) => s + c.health_score, 0) / clients.length) : 100;
  const weekHours = leverageLogs
    .filter((l) => new Date(l.timestamp) >= new Date(Date.now() - 7 * 86400000))
    .reduce((s, l) => s + Number(l.hours_saved), 0);
  const unresolvedReports = agentReports.filter((r) => !r.is_resolved);

  return (
    <div className="flex flex-col h-full">
      {/* ═══ TOP BAR ════════════════════════════════════════════════════ */}
      <div className="h-14 border-b border-border flex items-center px-6 bg-card/40 backdrop-blur-sm shrink-0">
        <Activity className="w-4 h-4 text-primary mr-2" />
        <span className="text-sm font-bold text-foreground">Command Hub</span>
        <span className="text-xs text-muted-foreground ml-3">Venture OS</span>

        <div className="ml-auto flex items-center gap-4">
          {unresolvedReports.length > 0 && (
            <Link href="/terminal" className="flex items-center gap-1.5 text-xs font-medium level-warning hover:text-foreground transition-colors">
              <AlertTriangle className="w-3.5 h-3.5" />
              {unresolvedReports.length} alert{unresolvedReports.length > 1 ? 's' : ''}
            </Link>
          )}
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 status-blink" />
            <span className="text-[11px] text-emerald-500/80">Systems Nominal</span>
          </div>
        </div>
      </div>

      {/* ═══ MAIN ═══════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 fade-in">

        {/* ─── KPI Row ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-5 gap-4">
          <KPI
            icon={<DollarSign className="w-5 h-5" />}
            label="Active Revenue"
            value={currency(activeRevenue)}
            sub={`${activeContracts.length} contracts`}
            accent="var(--color-revenue)"
          />
          <KPI
            icon={<TrendingUp className="w-5 h-5" />}
            label="Pipeline (Weighted)"
            value={currency(pipelineRevenue)}
            sub={`${pipelineOpps.length} opportunities`}
            accent="var(--color-pipeline)"
          />
          <KPI
            icon={<Users className="w-5 h-5" />}
            label="Client Health"
            value={`${avgHealth}%`}
            sub={`${clients.length} clients`}
            accent={avgHealth >= 80 ? "var(--color-revenue)" : avgHealth >= 60 ? "var(--color-gold)" : "var(--color-danger)"}
          />
          <KPI
            icon={<FolderKanban className="w-5 h-5" />}
            label="Active Projects"
            value={activeProjects.length.toString()}
            sub={`${projects.length} total`}
            accent="var(--color-pipeline)"
          />
          <KPI
            icon={<Zap className="w-5 h-5" />}
            label="Leverage (7d)"
            value={`${weekHours.toFixed(1)}h`}
            sub={currency(weekHours * 100) + " saved"}
            accent="var(--color-gold)"
          />
        </div>

        {/* ─── Main Grid ───────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-5">

          {/* ─── Pipeline Snapshot ─────────────────────────────────── */}
          <div className="col-span-2 glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Pipeline Snapshot</h2>
              <Link href="/pipeline" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {pipelineOpps.length === 0 ? (
              <div className="py-10 text-center">
                <TrendingUp className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No active pipeline</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pipelineOpps.slice(0, 6).map((opp) => {
                  const sc = stageColors[opp.stage] ?? stageColors.Draft;
                  const sv = svcColors[opp.service_type] ?? svcColors.Web;
                  return (
                    <div key={opp.id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/20 hover:bg-accent/35 transition-colors">
                      <div className={`w-2 h-8 rounded-full ${sc.bg}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{opp.title}</div>
                        <div className="text-xs text-muted-foreground/60 mt-0.5">
                          {clients.find((c) => c.id === opp.client_id)?.name ?? "—"}
                        </div>
                      </div>
                      <span className={`text-[10px] font-semibold ${sv.css} ${sv.bg} px-2 py-0.5 rounded-md border ${sv.border}`}>
                        {opp.service_type}
                      </span>
                      <span className={`text-xs font-medium ${sc.css}`}>{opp.stage}</span>
                      <span className="text-sm font-bold text-foreground">{currency(Number(opp.estimated_value))}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ─── Agent Feed ────────────────────────────────────────── */}
          <div className="glass-card p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                Son of Anton
              </h2>
              <Link href="/terminal" className="text-xs text-primary hover:underline">Open</Link>
            </div>

            {agentReports.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No agent reports.</p>
              </div>
            ) : (
              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {agentReports.slice(0, 5).map((r) => (
                  <div key={r.id} className="p-3 rounded-lg bg-accent/20 border border-border/30">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-semibold uppercase ${
                        r.severity === "critical" ? "level-critical" :
                        r.severity === "warning" ? "level-warning" : "level-info"
                      }`}>
                        {r.severity}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50">{timeAgo(r.created_at)}</span>
                      {!r.is_resolved && (
                        <span className="ml-auto text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">OPEN</span>
                      )}
                    </div>
                    <div className="text-xs text-foreground/80">{r.title}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Clients Row ─────────────────────────────────────────── */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Client Portfolio</h2>
            <Link href="/clients" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {clients.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No clients yet. Add your first client.</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {clients.slice(0, 8).map((client) => (
                <Link key={client.id} href={`/clients/${client.id}`}>
                  <div className="p-3.5 rounded-lg bg-accent/20 hover:bg-accent/35 transition-all group cursor-pointer border border-transparent hover:border-border/40">
                    <div className="flex items-center gap-3 mb-2.5">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                        style={{ background: client.brand_primary }}
                      >
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {client.name}
                        </div>
                        <HealthBadge score={client.health_score} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ─── Deployments Strip ────────────────────────────────────── */}
        {deployments.length > 0 && (
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Rocket className="w-4 h-4 text-primary" /> Deployment HUD
              </h2>
              <Link href="/deployments" className="text-xs text-primary hover:underline">View all</Link>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {deployments.slice(0, 4).map((d) => (
                <div key={d.id} className="p-3 rounded-lg bg-accent/20 border border-border/30 flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${d.status === "healthy" ? "bg-emerald-500" : d.status === "degraded" ? "bg-amber-500" : "bg-red-500"} shrink-0`} />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{d.label}</div>
                    <div className="text-[10px] text-muted-foreground/50">{d.environment}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function KPI({ icon, label, value, sub, accent }: {
  icon: React.ReactNode; label: string; value: string; sub: string; accent: string;
}) {
  return (
    <div className="glass-card kpi-card p-4" style={{ "--kpi-accent": accent } as React.CSSProperties}>
      <div className="flex items-center gap-2 mb-2.5">
        <span style={{ color: accent }}>{icon}</span>
        <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground/60 mt-1">{sub}</div>
    </div>
  );
}

function HealthBadge({ score }: { score: number }) {
  const cls = score >= 80 ? "health-excellent" : score >= 60 ? "health-good" : score >= 40 ? "health-warning" : "health-critical";
  return (
    <span className={`text-[10px] font-semibold ${cls}`}>{score}% health</span>
  );
}
