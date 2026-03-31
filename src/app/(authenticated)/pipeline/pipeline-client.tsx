"use client";

import { useState } from "react";
import type { Client, Opportunity, OpportunityStage } from "@/types/database";
import { TrendingUp, Plus, DollarSign, Calendar, MapPin, Search } from "lucide-react";
import { OpportunityForm } from "@/components/forms/opportunity-form";
import { updateOpportunity } from "@/lib/actions/opportunities";

const stages = [
  { key: "Needs Assessment", color: "oklch(0.58 0.01 285)", cls: "text-muted-foreground", label: "Needs Assessment" },
  { key: "Draft", color: "oklch(0.65 0.10 265)", cls: "text-indigo-400", label: "Draft / Initial" },
  { key: "Price Offer Sent", color: "oklch(0.70 0.19 265)", cls: "text-blue-400", label: "Proposal Sent" },
  { key: "Negotiating", color: "oklch(0.78 0.14 80)", cls: "text-amber-400", label: "Negotiation" },
  { key: "Won", color: "oklch(0.72 0.20 155)", cls: "text-emerald-400", label: "Won" },
  { key: "Postponed", color: "oklch(0.60 0.05 250)", cls: "text-slate-400", label: "Postponed" },
  { key: "Lost", color: "oklch(0.55 0.20 25)", cls: "text-red-400", label: "Lost" },
];

const currency = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

export function PipelineBoard({ opportunities, clients }: { opportunities: Opportunity[]; clients: Client[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editOpp, setEditOpp] = useState<Opportunity | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOpps = opportunities.filter(o => 
    o.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    clients.find(c => c.id === o.client_id)?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="h-16 border-b border-border flex items-center px-6 bg-card/40 backdrop-blur-sm shrink-0 gap-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <div>
           <h1 className="text-sm font-bold text-foreground leading-tight">Sales Pipeline</h1>
           <span className="text-[10px] text-muted-foreground">{opportunities.length} active opportunities</span>
        </div>
        
        <div className="ml-auto flex items-center gap-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search deals or clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 h-8 bg-accent/20 border border-border/50 rounded-lg text-xs w-64 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <button onClick={() => { setEditOpp(null); setShowForm(true); }} className="btn-gradient px-4 py-1.5 text-xs flex items-center gap-1.5 shadow-sm">
            <Plus className="w-3.5 h-3.5" /> Add Opportunity
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-6 fade-in">
        <div className="flex gap-4 h-full min-w-max">
          {stages.map((stage) => {
            const stageOpps = filteredOpps.filter((o) => o.stage === stage.key || (stage.key === "Needs Assessment" && o.stage === "Needs Assessment" as any) || (stage.key === "Postponed" && o.stage === "Postponed" as any));
            const stageTotal = stageOpps.reduce((s, o) => s + o.estimated_value, 0);
            
            return (
              <div key={stage.key} className="w-[300px] flex flex-col shrink-0 bg-accent/5 rounded-xl border border-border/30 overflow-hidden">
                <div className="p-3.5 border-b border-border/50 bg-card/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                      <span className={`text-xs font-bold uppercase tracking-wider ${stage.cls}`}>{stage.label}</span>
                    </div>
                    <span className="text-[10px] font-bold bg-background border border-border/50 px-2 py-0.5 rounded-full text-muted-foreground">{stageOpps.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold tracking-tight text-foreground">{currency(stageTotal)}</span>
                    <div className="w-24 h-1 bg-accent rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, stageTotal / 500000 * 100)}%`, background: stage.color }} />
                    </div>
                  </div>
                </div>

                <div className="pipeline-lane flex-1 p-3 space-y-3 overflow-y-auto">
                  {stageOpps.length === 0 ? (
                    <div className="h-24 flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-lg opacity-50">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Empty Lane</span>
                    </div>
                  ) : stageOpps.map((opp) => {
                    const client = clients.find(c => c.id === opp.client_id);
                    return (
                      <div key={opp.id} onClick={() => { setEditOpp(opp); setShowForm(true); }} className="bg-card border border-border/50 p-3.5 rounded-lg cursor-pointer hover:border-primary/40 hover:shadow-md transition-all group relative overflow-hidden">
                        {/* Status accent bar */}
                        <div className="absolute top-0 left-0 bottom-0 w-1 opacity-50" style={{ background: stage.color }} />
                        
                        <div className="pl-2">
                           <div className="flex items-start justify-between gap-2 mb-1.5">
                             <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors flex-1 line-clamp-2 leading-snug">{opp.title}</h4>
                           </div>
                           
                           <div className="text-[10px] text-muted-foreground mb-3 font-medium flex items-center gap-1.5">
                             {client?.name || "Unknown Client"} 
                             {client?.classification === 'VIP' && <span className="text-[8px] bg-amber-500/20 text-amber-500 px-1 py-0.5 rounded font-bold uppercase">VIP</span>}
                           </div>

                           <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 mt-auto pt-2 border-t border-border/40">
                             <span className="flex items-center gap-1 font-bold text-foreground">
                                <DollarSign className="w-3 h-3 text-emerald-500" />
                                {currency(opp.estimated_value)}
                             </span>
                             {opp.expected_close && (
                                <span className={`flex items-center gap-1 font-medium ${new Date(opp.expected_close) < new Date() ? 'text-red-400' : ''}`}>
                                  <Calendar className="w-3 h-3" />
                                  {new Date(opp.expected_close).toLocaleDateString("en", { month: "short", day: "numeric" })}
                                </span>
                             )}
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <OpportunityForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditOpp(null); }}
        clients={clients}
        editOpp={editOpp}
      />
    </div>
  );
}
