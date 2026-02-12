"use client";

import Link from "next/link";
import type { Client, Opportunity, Contract, Project, AgentReport } from "@/types/database";
import {
  ArrowLeft, Heart, FileText, FolderKanban, TrendingUp,
  Bot, ExternalLink, Globe, Palette,
} from "lucide-react";

function currency(v: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v); }

const stageColors: Record<string, string> = {
  Draft: "stage-draft", "Price Offer Sent": "stage-sent", Negotiating: "stage-negotiating", Won: "stage-won", Lost: "stage-lost",
};
const contractColors: Record<string, string> = {
  Draft: "text-muted-foreground", "Pending Signature": "text-amber-400", Active: "text-emerald-400", Completed: "text-blue-400", Terminated: "text-red-400",
};

export function ClientDossier({
  client, opportunities, contracts, projects, agentReports,
}: {
  client: Client; opportunities: Opportunity[]; contracts: Contract[]; projects: Project[]; agentReports: AgentReport[];
}) {
  const activeContracts = contracts.filter((c) => c.status === "Active");
  const totalRevenue = activeContracts.reduce((s, c) => s + Number(c.total_value), 0);
  const unresolvedAlerts = agentReports.filter((r) => !r.is_resolved);

  return (
    <div className="flex flex-col h-full">
      {/* ─── Top Bar ───────────────────────────────────────────────── */}
      <div className="h-14 border-b flex items-center px-6 shrink-0" style={{
        borderColor: `${client.brand_primary}20`,
        background: `linear-gradient(90deg, ${client.brand_primary}08, transparent)`,
      }}>
        <Link href="/clients" className="mr-3 p-1.5 hover:bg-accent rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </Link>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white mr-3"
          style={{ background: `linear-gradient(135deg, ${client.brand_primary}, ${client.brand_secondary})` }}
        >
          {client.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <span className="text-sm font-bold text-foreground">{client.name}</span>
          <span className="block text-[10px] text-muted-foreground">Client Dossier</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Heart className="w-4 h-4" style={{ color: client.health_score >= 75 ? "oklch(0.72 0.20 155)" : "oklch(0.78 0.14 80)" }} />
            <span className={`text-sm font-bold ${client.health_score >= 75 ? "health-excellent" : "health-warning"}`}>{client.health_score}%</span>
          </div>
          {unresolvedAlerts.length > 0 && (
            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">{unresolvedAlerts.length} alert{unresolvedAlerts.length > 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* ─── Content ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 fade-in">

        {/* ─── Brand & Overview ────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-5">
          <div className="glass-card p-5 col-span-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">One-Sheet</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-[10px] text-muted-foreground/50 mb-1">Contact</div>
                <div className="text-sm text-foreground">{client.email || "—"}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{client.phone || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground/50 mb-1">Active Revenue</div>
                <div className="text-lg font-bold gradient-text-revenue">{currency(totalRevenue)}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground/50 mb-1">Projects</div>
                <div className="text-lg font-bold text-foreground">{projects.length}</div>
                <div className="text-xs text-muted-foreground">{contracts.length} contracts</div>
              </div>
            </div>
            {client.notes && (
              <div className="mt-4 pt-4 border-t border-border/40">
                <div className="text-xs text-muted-foreground/80">{client.notes}</div>
              </div>
            )}
          </div>

          {/* Asset Drawer */}
          <div className="glass-card p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Palette className="w-3.5 h-3.5" /> Brand Assets
            </h2>
            <div className="space-y-3">
              <div className="flex gap-2">
                {[client.brand_primary, client.brand_secondary, client.brand_accent].map((c, i) => (
                  <div key={i} className="flex-1">
                    <div className="h-8 rounded-lg border border-border/30" style={{ background: c }} />
                    <div className="text-[9px] text-muted-foreground/50 font-mono mt-1 text-center">{c}</div>
                  </div>
                ))}
              </div>
              {client.brand_assets_url && (
                <a href={client.brand_assets_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-primary hover:underline">
                  <Globe className="w-3 h-3" /> Assets URL <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ─── Contracts & Opportunities ────────────────────────────── */}
        <div className="grid grid-cols-2 gap-5">
          <div className="glass-card p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" /> Contracts
            </h2>
            {contracts.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No contracts yet.</p>
            ) : (
              <div className="space-y-2">
                {contracts.map((c) => (
                  <div key={c.id} className="p-3 rounded-lg bg-accent/20 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{c.title}</div>
                      <span className={`text-[10px] font-semibold ${contractColors[c.status] ?? "text-muted-foreground"}`}>{c.status}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">{currency(Number(c.total_value))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" /> Opportunities
            </h2>
            {opportunities.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No opportunities yet.</p>
            ) : (
              <div className="space-y-2">
                {opportunities.map((o) => (
                  <div key={o.id} className="p-3 rounded-lg bg-accent/20 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{o.title}</div>
                      <span className={`text-[10px] font-semibold ${stageColors[o.stage] ?? ""}`}>{o.stage}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">{currency(Number(o.estimated_value))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Projects ────────────────────────────────────────────── */}
        {projects.length > 0 && (
          <div className="glass-card p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <FolderKanban className="w-3.5 h-3.5" /> Projects
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {projects.map((p) => (
                <Link key={p.id} href={`/forge/${p.id}`}>
                  <div className="p-3 rounded-lg bg-accent/20 hover:bg-accent/35 transition-colors cursor-pointer">
                    <div className="text-sm font-medium text-foreground truncate">{p.name}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[10px] font-semibold phase-${p.status?.toLowerCase()}`}>{p.status}</span>
                      <div className="flex-1 h-1 bg-accent rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary/50" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{p.progress}%</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ─── Agent Reports for Client ────────────────────────────── */}
        {agentReports.length > 0 && (
          <div className="glass-card p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Bot className="w-3.5 h-3.5" /> Agent Intel
            </h2>
            <div className="space-y-2">
              {agentReports.map((r) => (
                <div key={r.id} className="p-3 rounded-lg bg-accent/20 border-l-2" style={{
                  borderColor: r.severity === "critical" ? "oklch(0.63 0.24 25)" : r.severity === "warning" ? "oklch(0.78 0.14 80)" : "oklch(0.5 0.01 285)",
                }}>
                  <div className="text-xs font-medium text-foreground">{r.title}</div>
                  {r.body && <div className="text-xs text-muted-foreground/60 mt-1 line-clamp-2">{r.body}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
