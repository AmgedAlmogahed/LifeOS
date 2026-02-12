"use client";

import Link from "next/link";
import { FolderKanban, Search, ArrowRight, Plus, Zap } from "lucide-react";
import { useState } from "react";
import { ProjectForm } from "@/components/forms/project-form";
import type { Project, Client, Lifecycle, Sprint } from "@/types/database";

const svcColors: Record<string, string> = {
  Cloud: "svc-cloud svc-bg-cloud svc-border-cloud", Web: "svc-web svc-bg-web svc-border-web",
  Design: "svc-design svc-bg-design svc-border-design", Marketing: "svc-marketing svc-bg-marketing svc-border-marketing",
};

export function ForgeList({ projects, clients, lifecycles, activeSprints = [] }: { 
    projects: Project[]; 
    clients: Pick<Client, "id" | "name" | "brand_primary">[]; 
    lifecycles: Lifecycle[];
    activeSprints?: Sprint[];
}) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));
  const lcMap = Object.fromEntries(lifecycles.map((l) => [l.project_id, l]));
  const sprintMap = Object.fromEntries((activeSprints || []).map(s => [s.project_id, s]));
  const filtered = projects.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-border flex items-center px-6 bg-card/40 backdrop-blur-sm shrink-0 gap-4">
        <FolderKanban className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-foreground">The Forge</span>
        <span className="text-xs text-muted-foreground">{filtered.length} projects</span>
        <div className="ml-auto flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
              className="h-8 pl-9 pr-3 bg-accent border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-44" />
          </div>
          <button onClick={() => setShowForm(true)} className="btn-gradient px-3 py-1.5 text-xs flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> New Project
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <FolderKanban className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No projects in the forge.</p>
            <button onClick={() => setShowForm(true)} className="btn-gradient px-4 py-2 text-xs mt-4 inline-flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Create your first project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map((p) => {
              const client = p.client_id ? clientMap[p.client_id] : null;
              const lc = lcMap[p.id];
              const sv = svcColors[p.service_type ?? ""] ?? "";
              return (
                <Link key={p.id} href={`/forge/${p.id}`}>
                  <div className="glass-card p-5 group cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border border-border/30"
                        style={client ? { background: `${client.brand_primary ?? '#6366f1'}18`, color: client.brand_primary ?? undefined } : { background: "oklch(0.20 0.01 285)" }}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{p.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          {client && <span className="text-[10px] text-muted-foreground/60">{client.name}</span>}
                          {p.service_type && <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${sv}`}>{p.service_type}</span>}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    
                    {sprintMap[p.id] && (
                        <div className="mb-3 flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-md px-2 py-1.5">
                            <Zap className="w-3 h-3 text-primary fill-primary/20" />
                            <span className="text-xs font-semibold text-foreground">Sprint {sprintMap[p.id].sprint_number}</span>
                            <span className="text-[10px] text-muted-foreground ml-auto">
                                Ends {new Date(sprintMap[p.id].planned_end_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-semibold phase-${p.status?.toLowerCase()}`}>{p.status}</span>
                      {lc && <span className="text-[10px] text-muted-foreground">→ {lc.current_stage}</span>}
                      <div className="flex-1 h-1.5 bg-accent rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary/50 transition-all" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground data-mono">{p.progress}%</span>
                    </div>
                    {p.is_frozen && <div className="mt-2 text-[9px] font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded w-fit">FROZEN</div>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <ProjectForm
        open={showForm}
        onClose={() => setShowForm(false)}
        clients={clients as Client[]}
      />
    </div>
  );
}
