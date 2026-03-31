"use client";

import { PieChart, BarChart3, TrendingUp, Users, Building2, Briefcase } from "lucide-react";

function currency(v: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v); }

export function DashboardClient({ accounts, globalMetrics }: { accounts: any[], globalMetrics: any }) {
  return (
    <div className="flex flex-col h-full bg-background fade-in">
      <div className="h-16 border-b border-border flex items-center px-6 bg-card/40 backdrop-blur-sm shrink-0 gap-4">
        <PieChart className="w-5 h-5 text-indigo-400" />
        <div>
           <h1 className="text-sm font-bold text-foreground leading-tight">Corporate Dashboard</h1>
           <span className="text-[10px] text-muted-foreground">Cross-Company Command Center</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full space-y-8">

        {/* Aggregate Level */}
        <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
               <Briefcase className="w-4 h-4 text-primary" /> Global Portfolio Performance
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card p-5">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground/60 mb-2">Total Project Volume</div>
                    <div className="text-2xl font-bold flex items-end gap-2 text-foreground">
                        {globalMetrics.projectsAll} <span className="text-xs text-emerald-500 font-medium pb-1 flex items-center gap-0.5"><TrendingUp className="w-3 h-3"/> Active</span>
                    </div>
                </div>
                <div className="glass-card p-5">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground/60 mb-2">Global Client Base</div>
                    <div className="text-2xl font-bold flex items-end gap-2 text-foreground">
                        {globalMetrics.activeClients} <span className="text-xs text-muted-foreground font-medium pb-1 flex items-center gap-0.5"><Users className="w-3 h-3"/> Reached</span>
                    </div>
                </div>
                <div className="glass-card p-5 border-blue-500/20">
                    <div className="text-[10px] uppercase font-bold text-blue-500/60 mb-2">Aggregated Pipeline</div>
                    <div className="text-2xl font-bold flex items-end gap-2 text-blue-400">
                        {currency(globalMetrics.pipelineTotal)}
                    </div>
                </div>
                <div className="glass-card p-5 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
                    <div className="text-[10px] uppercase font-bold text-emerald-500/60 mb-2">Collected Revenue</div>
                    <div className="text-2xl font-bold flex items-end gap-2 text-emerald-500">
                        {currency(globalMetrics.revenueTotal)}
                    </div>
                </div>
            </div>
        </div>

        {/* Entity Split */}
        <div>
           <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
               <Building2 className="w-4 h-4 text-indigo-400" /> Operational Entities
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
               {accounts.map(acc => (
                  <div key={acc.id} className="glass-card p-0 overflow-hidden group hover:border-primary/40 transition-colors">
                     <div className="h-2 w-full" style={{ background: acc.primary_color || '#6366f1' }} />
                     <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                           {acc.logo_url ? (
                               <img src={acc.logo_url} className="w-10 h-10 rounded-lg object-cover" />
                           ) : (
                               <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ background: acc.primary_color || '#6366f1' }}>
                                  {acc.name.charAt(0)}
                               </div>
                           )}
                           <div className="flex-1">
                               <h3 className="font-bold text-foreground text-sm">{acc.name}</h3>
                               <p className="text-[10px] text-muted-foreground">{acc.legal_name || 'Holding Company'}</p>
                           </div>
                        </div>
                        <div className="space-y-3 border-t border-border/50 pt-4 mt-2">
                           <div className="flex justify-between items-center text-xs">
                               <span className="text-muted-foreground">Entity CR:</span>
                               <span className="font-mono">{acc.cr_number || 'N/A'}</span>
                           </div>
                           <div className="flex justify-between items-center text-xs">
                               <span className="text-muted-foreground">Location:</span>
                               <span>{acc.city || 'HQ'}</span>
                           </div>
                           <div className="flex justify-between items-center text-xs">
                               <span className="text-muted-foreground">Status:</span>
                               <span className="text-emerald-500 font-bold uppercase tracking-wider text-[10px]">Active</span>
                           </div>
                        </div>
                     </div>
                  </div>
               ))}
           </div>
        </div>

      </div>
    </div>
  );
}
