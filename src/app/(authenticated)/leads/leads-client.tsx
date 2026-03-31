"use client";

import { useState, useTransition } from "react";
import { UserPlus, Search, LayoutGrid, List, CheckCircle, XCircle, ArrowRight, Loader2 } from "lucide-react";
import { LeadForm } from "@/components/forms/lead-form";
import { updateLeadStatus, convertLead } from "@/lib/actions/leads";
import { useRouter } from "next/navigation";

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
  const [showForm, setShowForm] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const filtered = leads.filter((lead) => {
    if (search && !lead.contact_name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && lead.status !== statusFilter) return false;
    if (channelFilter !== "all" && lead.channel !== channelFilter) return false;
    return true;
  });

  const statuses = ["INCOMING", "CONTACTED", "QUALIFIED", "DISQUALIFIED", "CONVERTED"];

  const handleStatusChange = (id: string, newStatus: string) => {
    setPendingId(id);
    startTransition(async () => {
      await updateLeadStatus(id, newStatus);
      setPendingId(null);
    });
  };

  const handleConvert = (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      const res = await convertLead(id);
      setPendingId(null);
      if (res.success && res.clientId) {
        router.push(`/clients/${res.clientId}`); // take them to the new client
      } else {
        alert(res.error || "Failed to convert lead");
      }
    });
  };

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
          <button onClick={() => setShowForm(true)} className="btn-gradient px-3 py-1.5 text-xs flex items-center gap-1.5">
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
                <button onClick={() => setShowForm(true)} className="btn-gradient px-4 py-2 text-xs mt-3 inline-flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" /> Capture your first lead
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {filtered.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center gap-4 py-3 px-4 hover:bg-accent/10 transition-colors"
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
                        {lead.email && <span className="text-[10px] text-muted-foreground/40">{lead.email}</span>}
                        {lead.mobile && <span className="text-[10px] text-muted-foreground/40">{lead.mobile}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                      {pendingId === lead.id ? (
                        <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                      ) : (
                        <>
                          {lead.status === "INCOMING" && (
                            <button onClick={() => handleStatusChange(lead.id, "CONTACTED")} className="px-2 py-1 bg-accent hover:bg-amber-500/20 text-xs rounded-md transition-colors" title="Mark as Contacted">Contact</button>
                          )}
                          {(lead.status === "INCOMING" || lead.status === "CONTACTED") && (
                            <>
                              <button onClick={() => handleStatusChange(lead.id, "QUALIFIED")} className="px-2 py-1 bg-accent hover:bg-emerald-500/20 text-emerald-500 text-xs rounded-md transition-colors" title="Qualify"><CheckCircle className="w-3 h-3" /></button>
                              <button onClick={() => handleStatusChange(lead.id, "DISQUALIFIED")} className="px-2 py-1 bg-accent hover:bg-red-500/20 text-red-500 text-xs rounded-md transition-colors" title="Disqualify"><XCircle className="w-3 h-3" /></button>
                            </>
                          )}
                          {lead.status === "QUALIFIED" && (
                            <button onClick={() => handleConvert(lead.id)} className="px-2 py-1 btn-gradient text-xs rounded-md transition-colors flex items-center gap-1">Convert <ArrowRight className="w-3 h-3" /></button>
                          )}
                        </>
                      )}
                    </div>

                    {lead.estimated_value > 0 && (
                      <span className="text-xs font-bold text-foreground w-20 text-right">
                        {Number(lead.estimated_value).toLocaleString()} SAR
                      </span>
                    )}
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${statusColors[lead.status] ?? ""} w-24 text-center`}>
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Kanban view */
          <div className="flex gap-4 overflow-x-auto pb-4 h-full">
            {statuses.map((status) => {
              const items = filtered.filter((l) => l.status === status);
              return (
                <div key={status} className="w-[280px] flex flex-col shrink-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusColors[status]}`}>
                      {status}
                    </span>
                    <span className="text-[10px] text-muted-foreground/40">{items.length}</span>
                  </div>
                  <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                    {items.map((lead) => (
                      <div key={lead.id} className="glass-card p-3 rounded-lg hover:border-primary/30 transition-colors group">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-semibold text-foreground truncate">{lead.contact_name}</h4>
                          <span className={`text-[9px] font-medium ${priorityColors[lead.priority] ?? ""}`}>
                            {lead.priority !== "Normal" ? lead.priority : ""}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60 block mt-0.5">
                          {channelLabels[lead.channel] ?? lead.channel}
                        </span>
                        
                        {(lead.email || lead.mobile) && (
                           <div className="text-[10px] text-muted-foreground/40 mt-1 truncate">
                             {lead.email} {lead.email && lead.mobile && "•"} {lead.mobile}
                           </div>
                        )}

                        {lead.estimated_value > 0 && (
                          <span className="text-[10px] font-bold text-foreground/70 mt-2 block">
                            {Number(lead.estimated_value).toLocaleString()} SAR
                          </span>
                        )}

                        {/* Kanban Actions Overlay */}
                        <div className="pt-3 mt-2 border-t border-border/50 hidden group-hover:flex items-center gap-1.5 transition-all">
                           {pendingId === lead.id ? (
                             <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin mx-auto" />
                           ) : (
                             <>
                              {lead.status === "INCOMING" && (
                                <button onClick={() => handleStatusChange(lead.id, "CONTACTED")} className="flex-1 text-[10px] py-1 bg-accent/50 hover:bg-amber-500/20 rounded">Contacted</button>
                              )}
                              {(lead.status === "INCOMING" || lead.status === "CONTACTED") && (
                                <>
                                  <button onClick={() => handleStatusChange(lead.id, "QUALIFIED")} className="flex-1 text-[10px] py-1 bg-accent/50 hover:bg-emerald-500/20 text-emerald-500 rounded flex items-center justify-center gap-1"><CheckCircle className="w-2.5 h-2.5"/> Qualify</button>
                                  <button onClick={() => handleStatusChange(lead.id, "DISQUALIFIED")} className="flex-1 text-[10px] py-1 bg-accent/50 hover:bg-red-500/20 text-red-500 rounded flex items-center justify-center gap-1"><XCircle className="w-2.5 h-2.5"/> Drop</button>
                                </>
                              )}
                              {lead.status === "QUALIFIED" && (
                                <button onClick={() => handleConvert(lead.id)} className="flex-1 text-[10px] py-1 btn-gradient rounded flex items-center justify-center gap-1">Convert <ArrowRight className="w-2.5 h-2.5" /></button>
                              )}
                             </>
                           )}
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <div className="text-center py-6 text-[10px] text-muted-foreground/30 border border-dashed border-border rounded-lg">
                        Empty
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <LeadForm open={showForm} onClose={() => setShowForm(false)} accounts={accounts} />
    </div>
  );
}
