"use client";

import { useState } from "react";
import type { Deployment, Project, Client } from "@/types/database";
import { Rocket, ExternalLink, Globe, Plus } from "lucide-react";
import { DeploymentForm } from "@/components/forms/deployment-form";

function timeAgo(ts: string) {
  const d = Date.now() - new Date(ts).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const envColors: Record<string, { bg: string; text: string }> = {
  Vercel: { bg: "bg-white/10", text: "text-white" },
  Railway: { bg: "bg-violet-500/15", text: "text-violet-400" },
  Alibaba: { bg: "bg-orange-500/15", text: "text-orange-400" },
  AWS: { bg: "bg-amber-500/15", text: "text-amber-400" },
  Other: { bg: "bg-accent", text: "text-muted-foreground" },
};

const statusDot: Record<string, string> = {
  healthy: "bg-emerald-500",
  degraded: "bg-amber-500",
  down: "bg-red-500",
  deploying: "bg-blue-500 animate-pulse",
  unknown: "bg-gray-500",
};

export function DeploymentsPage({ deployments, projects, clients }: {
  deployments: Deployment[]; projects: Pick<Project, "id" | "name">[]; clients: Pick<Client, "id" | "name">[];
}) {
  const [showForm, setShowForm] = useState(false);
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));
  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]));

  const healthy = deployments.filter((d) => d.status === "healthy").length;
  const degraded = deployments.filter((d) => d.status === "degraded").length;
  const down = deployments.filter((d) => d.status === "down").length;

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-border flex items-center px-6 bg-card/40 backdrop-blur-sm shrink-0 gap-4">
        <Rocket className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-foreground">Deployment HUD</span>
        <span className="text-xs text-muted-foreground">{deployments.length} environments</span>
        <div className="ml-auto flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />{healthy} healthy</span>
          {degraded > 0 && <span className="flex items-center gap-1.5 text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-500" />{degraded} degraded</span>}
          {down > 0 && <span className="flex items-center gap-1.5 text-red-400"><span className="w-2 h-2 rounded-full bg-red-500" />{down} down</span>}
          <button onClick={() => setShowForm(true)} className="btn-gradient px-3 py-1.5 text-xs flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Deployment
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 fade-in">
        {deployments.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Rocket className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No deployments tracked yet.</p>
            <button onClick={() => setShowForm(true)} className="btn-gradient px-4 py-2 text-xs mt-4 inline-flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add your first deployment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {deployments.map((d) => {
              const env = envColors[d.environment] ?? envColors.Other;
              const dot = statusDot[d.status] ?? statusDot.unknown;
              return (
                <div key={d.id} className="glass-card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-3 h-3 rounded-full ${dot} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">{d.label}</div>
                      <div className="text-[10px] text-muted-foreground/50">
                        {projectMap[d.project_id] ?? "—"}{d.client_id ? ` · ${clientMap[d.client_id] ?? ""}` : ""}
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${env.bg} ${env.text}`}>
                      {d.environment}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground/40">
                      Checked {d.last_checked_at ? timeAgo(d.last_checked_at) : "never"}
                    </span>
                    <span className={`text-xs font-semibold capitalize ${d.status === "healthy" ? "text-emerald-400" : d.status === "degraded" ? "text-amber-400" : d.status === "down" ? "text-red-400" : "text-muted-foreground"}`}>
                      {d.status}
                    </span>
                  </div>

                  {d.url && (
                    <a href={d.url} target="_blank" rel="noreferrer"
                      className="mt-3 flex items-center gap-2 text-xs text-primary hover:underline">
                      <Globe className="w-3 h-3" /> Visit <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DeploymentForm
        open={showForm}
        onClose={() => setShowForm(false)}
        projects={projects as Project[]}
      />
    </div>
  );
}
