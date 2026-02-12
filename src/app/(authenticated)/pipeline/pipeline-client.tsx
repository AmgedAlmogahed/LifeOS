"use client";

import { useState } from "react";
import type { Client, Opportunity, OpportunityStage } from "@/types/database";
import { TrendingUp, Plus, DollarSign, Calendar } from "lucide-react";
import { OpportunityForm } from "@/components/forms/opportunity-form";
import { updateOpportunity } from "@/lib/actions/opportunities";

const stages: { key: OpportunityStage; color: string; cls: string }[] = [
  { key: "Draft", color: "oklch(0.58 0.01 285)", cls: "stage-draft" },
  { key: "Price Offer Sent", color: "oklch(0.70 0.19 265)", cls: "stage-sent" },
  { key: "Negotiating", color: "oklch(0.78 0.14 80)", cls: "stage-negotiating" },
  { key: "Won", color: "oklch(0.72 0.20 155)", cls: "stage-won" },
  { key: "Lost", color: "oklch(0.55 0.20 25)", cls: "stage-lost" },
];

const currency = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

export function PipelineBoard({ opportunities, clients }: { opportunities: Opportunity[]; clients: Client[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editOpp, setEditOpp] = useState<Opportunity | null>(null);

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-border flex items-center px-6 bg-card/40 backdrop-blur-sm shrink-0 gap-4">
        <TrendingUp className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-foreground">Pipeline</span>
        <span className="text-xs text-muted-foreground">{opportunities.length} opportunities</span>
        <div className="ml-auto">
          <button onClick={() => { setEditOpp(null); setShowForm(true); }} className="btn-gradient px-3 py-1.5 text-xs flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Opportunity
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-6 fade-in">
        <div className="flex gap-4 h-full min-w-max">
          {stages.map((stage) => {
            const stageOpps = opportunities.filter((o) => o.stage === stage.key);
            const stageTotal = stageOpps.reduce((s, o) => s + o.estimated_value, 0);
            return (
              <div key={stage.key} className="w-72 flex flex-col shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: stage.color }} />
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${stage.cls}`}>{stage.key}</span>
                  <span className="text-[10px] text-muted-foreground/50 ml-auto">{stageOpps.length}</span>
                </div>

                {/* probability bar */}
                <div className="h-1 bg-accent rounded-full mb-3 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, stageTotal / 500)}%`, background: stage.color }} />
                </div>

                <div className="pipeline-lane flex-1 p-3 space-y-2.5">
                  {stageOpps.length === 0 ? (
                    <p className="text-xs text-muted-foreground/30 text-center py-8">Empty</p>
                  ) : stageOpps.map((opp) => (
                    <div key={opp.id} onClick={() => { setEditOpp(opp); setShowForm(true); }} className="glass-card p-3.5 cursor-pointer group">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors flex-1 line-clamp-2">{opp.title}</h4>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded svc-bg-${opp.service_type.toLowerCase()} svc-${opp.service_type.toLowerCase()} font-medium shrink-0`}>
                          {opp.service_type}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground/60">
                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{currency(opp.estimated_value)}</span>
                        <span>{opp.probability}%</span>
                        {opp.expected_close && <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{new Date(opp.expected_close).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>}
                      </div>

                      {/* micro progress bar */}
                      <div className="h-0.5 bg-accent/40 rounded-full mt-2 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${opp.probability}%`, background: stage.color }} />
                      </div>
                    </div>
                  ))}
                </div>

                {stageTotal > 0 && (
                  <div className="mt-2 text-center">
                    <span className="text-[10px] data-mono text-muted-foreground/40">{currency(stageTotal)}</span>
                  </div>
                )}
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
