"use client";

import type { Invoice, Milestone } from "@/types/database";
import type { ScopeNode } from "@/lib/actions/scope-nodes";
import { DollarSign, Calendar, AlertCircle, CheckCircle2, Clock, Ghost } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  Paid:      "bg-emerald-500/10 text-emerald-400",
  Pending:   "bg-amber-500/10 text-amber-400",
  Overdue:   "bg-red-500/10 text-red-400",
  Cancelled: "bg-muted text-muted-foreground",
};

interface FinanceTabProps {
  projectId: string;
  projectBudget: number;
  invoices: Invoice[];
  milestones: Milestone[];
  scopeNodes: ScopeNode[];
}

export function FinanceTab({ projectBudget, invoices, milestones }: FinanceTabProps) {
  const totalInvoiced = invoices.reduce((s, i) => s + (i.amount || 0), 0);
  const paid = invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + (i.amount || 0), 0);
  const pct = projectBudget > 0 ? Math.min(100, Math.round((totalInvoiced / projectBudget) * 100)) : 0;

  return (
    <div className="p-3 space-y-4">
      {/* Budget progress */}
      <div className="bg-card/40 border border-border/50 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Budget Coverage</span>
          <span className="font-mono font-bold text-foreground">{pct}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", pct >= 100 ? "bg-red-400" : "bg-primary")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            { label: "Budget",   value: formatCurrency(projectBudget), color: "text-foreground" },
            { label: "Invoiced", value: formatCurrency(totalInvoiced),  color: "text-amber-400" },
            { label: "Paid",     value: formatCurrency(paid),           color: "text-emerald-400" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className={cn("text-sm font-bold font-mono", s.color)}>{s.value}</div>
              <div className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones with Ghost Invoice status */}
      <div>
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          Milestone Invoices
        </h3>

        {milestones.length === 0 ? (
          <div className="py-6 text-center">
            <Ghost className="w-8 h-8 text-muted-foreground/15 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground/50 italic">No milestones defined.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {milestones.map((m) => {
              // Link invoice: milestones don't have invoice_id column yet — all shown as Ghost placeholders
              const linkedInvoice = undefined;
              const isGhost = !linkedInvoice;

              return (
                <div
                  key={m.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-card/40 border border-border/40"
                >
                  <div className="mt-0.5 shrink-0">
                    {isGhost
                      ? <Ghost className="w-4 h-4 text-muted-foreground/40" />
                      : <DollarSign className="w-4 h-4 text-primary" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium truncate">{m.name}</span>
                      {isGhost && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground">
                          Ghost
                        </span>
                      )}
                    </div>
                    {m.deadline && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                        <Calendar className="w-3 h-3" /> {formatDate(m.deadline)}
                      </div>
                    )}
                    {/* Ghost invoices — no invoice_id FK yet; placeholder for future milestone linking */}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Invoices */}
      {invoices.length > 0 && (
        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            All Invoices
          </h3>
          <div className="space-y-1.5">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/30 border border-border/30"
              >
                <div className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0",
                  STATUS_STYLES[inv.status ?? "Pending"] ?? ""
                )}>
                  {inv.status}
                </div>
                <span className="text-xs text-muted-foreground truncate flex-1">
                  INV-{inv.id.slice(0, 8).toUpperCase()}
                </span>
                <span className="text-xs font-mono font-bold text-foreground shrink-0">
                  {formatCurrency(inv.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
