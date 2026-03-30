"use client";

import { useState } from "react";
import { UserPlus, Search, SlidersHorizontal, LayoutGrid, List } from "lucide-react";

const statusColors: Record<string, string> = {
  INCOMING: "bg-blue-500/10 text-blue-500",
  CONTACTED: "bg-amber-500/10 text-amber-500",
  QUALIFIED: "bg-emerald-500/10 text-emerald-500",
  DISQUALIFIED: "bg-red-500/10 text-red-500",
  CONVERTED: "bg-primary/10 text-primary",
};

const priorityColors: Record<string, string> = {
  Normal: "text-muted-foreground",
  High: "text-amber-500",
  Urgent: "text-red-500",
};

const channelLabels: Record<string, string> = {
  "CH-REF": "Referral",
  "CH-SOC": "Social Media",
  "CH-WEB": "Website / Email",
  "CH-MAP": "Direct Call",
  "CH-AI": "AI Chatbot",
  "CH-OUT": "Cold Outreach",
};

export function LeadsClient({
  leads,
  clients,
  accounts,
}: {
  leads: any[];
  clients: any[];
  accounts: any[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [view, setView] = useState<"list" | "kanban">("list");

  const filtered = leads.filter((lead) => {
    if (search && !lead.contact_name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && lead.status !== statusFilter) return false;
    if (channelFilter !== "all" && lead.channel !== channelFilter) return false;
    return true;
  });

  const statuses = ["INCOMING", "CONTACTED", "QUALIFIED", "DISQUALIFIED", "CONVERTED"];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center px-6 bg-card/40 backdrop-blur-sm shrink-0 gap-4">
        <UserPlus className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-foreground">Leads</span>
        <span className="text-xs text-muted-foreground">{leads.length} total</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex gap-1 p-0.5 bg-accent/30 rounded-lg">
            <button
              onClick={() => setView("list")}
              className={`p-1.5 rounded-md transition-all ${view === "list" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setView("kanban")}
              className={`p-1.5 rounded-md transition-all ${view === "kanban" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
          <button className="btn-gradient px-3 py-1.5 text-xs flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5" /> New Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border/50">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-accent/20 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground/40"
          />
        </div>
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="text-xs bg-accent/20 border border-border rounded-lg px-3 py-1.5 text-foreground"
        >
          <option value="all">All Channels</option>
          {Object.entries(channelLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-accent/20 border border-border rounded-lg px-3 py-1.5 text-foreground"
        >
          <option value="all">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 fade-in">
        {view === "list" ? (
          /* List view */
          <div className="glass-card">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No leads found.</p>
                <button className="btn-gradient px-4 py-2 text-xs mt-3 inline-flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" /> Capture your first lead
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {filtered.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center gap-4 py-3 px-4 hover:bg-accent/10 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-foreground truncate">{lead.contact_name}</h4>
                        <span className={`text-[10px] font-medium ${priorityColors[lead.priority] ?? ""}`}>
                          {lead.priority !== "Normal" ? lead.priority : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] text-muted-foreground/60">
                          {channelLabels[lead.channel] ?? lead.channel}
                        </span>
                        {lead.email && (
                          <span className="text-[10px] text-muted-foreground/40">{lead.email}</span>
                        )}
                        {lead.mobile && (
                          <span className="text-[10px] text-muted-foreground/40">{lead.mobile}</span>
                        )}
                      </div>
                    </div>
                    {lead.estimated_value > 0 && (
                      <span className="text-xs font-bold text-foreground">
                        {Number(lead.estimated_value).toLocaleString()} SAR
                      </span>
                    )}
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${statusColors[lead.status] ?? ""}`}>
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Kanban view */
          <div className="flex gap-4 overflow-x-auto pb-4">
            {statuses.map((status) => {
              const items = filtered.filter((l) => l.status === status);
              return (
                <div key={status} className="min-w-[260px] flex-shrink-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusColors[status]}`}>
                      {status}
                    </span>
                    <span className="text-[10px] text-muted-foreground/40">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((lead) => (
                      <div key={lead.id} className="glass-card p-3 rounded-lg cursor-pointer hover:border-primary/30 transition-colors">
                        <h4 className="text-sm font-semibold text-foreground truncate">{lead.contact_name}</h4>
                        <span className="text-[10px] text-muted-foreground/60 block mt-0.5">
                          {channelLabels[lead.channel] ?? lead.channel}
                        </span>
                        {lead.estimated_value > 0 && (
                          <span className="text-[10px] font-bold text-foreground/70 mt-1 block">
                            {Number(lead.estimated_value).toLocaleString()} SAR
                          </span>
                        )}
                      </div>
                    ))}
                    {items.length === 0 && (
                      <div className="text-center py-6 text-[10px] text-muted-foreground/30 border border-dashed border-border rounded-lg">
                        No leads
                      </div>
                    )}
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
