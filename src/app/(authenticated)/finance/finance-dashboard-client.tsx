"use client";

import { useState } from "react";
import { DollarSign, FileText, ArrowUpRight, ArrowDownRight, Building2, CreditCard, Receipt, Wallet, FilePlus } from "lucide-react";
import Link from "next/link";

function currency(v: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v); }

export function FinanceDashboardClient({ accounts, invoices, expenses }: { accounts: any[], invoices: any[], expenses: any[] }) {
  const [activeAccountId, setActiveAccountId] = useState<string | null>(accounts[0]?.id || null);

  const filteredInvoices = activeAccountId ? invoices.filter(i => i.account_id === activeAccountId) : invoices;
  const filteredExpenses = activeAccountId ? expenses.filter(e => e.account_id === activeAccountId) : expenses;

  const totalInvoiced = filteredInvoices.reduce((s, i) => s + (i.amount || 0), 0);
  const totalCollected = filteredInvoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.amount || 0), 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const netProfit = totalCollected - totalExpenses;

  const activeAccount = accounts.find(a => a.id === activeAccountId);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="h-16 border-b border-border flex items-center px-6 bg-card/40 backdrop-blur-sm shrink-0 gap-4">
        <Wallet className="w-5 h-5 text-emerald-500" />
        <div>
           <h1 className="text-sm font-bold text-foreground leading-tight">Financial Hub</h1>
           <span className="text-[10px] text-muted-foreground">P&L and Invoicing</span>
        </div>

        {/* Company Switcher Context */}
        <div className="ml-auto flex items-center gap-3">
           <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Entity:</span>
           <select 
             className="text-xs bg-accent/20 border border-border/50 rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-500/50"
             value={activeAccountId || ""}
             onChange={(e) => setActiveAccountId(e.target.value)}
           >
             <option value="">Cross-Company All</option>
             {accounts.map(a => <option key={a.id} value={a.id}>{a.name} {a.legal_name ? `(${a.legal_name})` : ''}</option>)}
           </select>
           <button className="text-xs btn-gradient bg-emerald-500 hover:bg-emerald-600 px-4 py-1.5 ml-2 shadow-sm rounded-md flex items-center gap-2">
             <FilePlus className="w-3.5 h-3.5" /> Generate Invoice
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 fade-in max-w-6xl mx-auto w-full">

        {/* Dash metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-card p-5">
            <h3 className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70 flex items-center gap-2 mb-3">
              <DollarSign className="w-3 h-3 text-emerald-500" /> Total Invoiced
            </h3>
            <div className="text-2xl font-bold text-foreground mb-1">{currency(totalInvoiced)}</div>
            <div className="text-[10px] text-muted-foreground">{filteredInvoices.length} total invoices</div>
          </div>
          <div className="glass-card p-5 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
            <h3 className="text-[10px] uppercase font-bold tracking-wider text-emerald-500/70 flex items-center gap-2 mb-3">
              <ArrowUpRight className="w-3 h-3 text-emerald-500" /> Revenue Collected
            </h3>
            <div className="text-2xl font-bold text-emerald-500 mb-1">{currency(totalCollected)}</div>
            <div className="text-[10px] text-muted-foreground">From paid invoices</div>
          </div>
          <div className="glass-card p-5 border-amber-500/20">
            <h3 className="text-[10px] uppercase font-bold tracking-wider text-amber-500/70 flex items-center gap-2 mb-3">
              <ArrowDownRight className="w-3 h-3 text-amber-500" /> Total Outlays
            </h3>
            <div className="text-2xl font-bold text-amber-500 mb-1">{currency(totalExpenses)}</div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
               <Link href="/expenses" className="text-primary hover:underline">View Expenses →</Link>
            </div>
          </div>
          <div className="glass-card p-5 relative overflow-hidden group">
            <div className={`absolute inset-0 bg-gradient-to-br ${netProfit >= 0 ? 'from-emerald-500/10 to-transparent' : 'from-red-500/10 to-transparent'} opacity-50`} />
            <h3 className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70 flex items-center gap-2 mb-3">
              <Building2 className={`w-3 h-3 ${netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`} /> Net Profit Margin
            </h3>
            <div className={`text-2xl font-bold mb-1 ${netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{currency(netProfit)}</div>
            <div className="text-[10px] text-muted-foreground">
               Operating margin: {totalCollected > 0 ? ((netProfit / totalCollected) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>

        {/* Ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="glass-card flex flex-col h-[500px]">
             <div className="p-4 border-b border-border/50 flex justify-between items-center bg-card/30">
               <h2 className="text-sm font-semibold flex items-center gap-2"><CreditCard className="w-4 h-4 text-emerald-500"/> Recent Invoices</h2>
               <Link href="/finance/invoices" className="text-[10px] text-primary hover:underline font-bold tracking-wider uppercase">View All</Link>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredInvoices.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-40">
                    <Receipt className="w-10 h-10 mb-3" />
                    <span className="text-xs">No invoices generated yet</span>
                  </div>
                ) : (
                  filteredInvoices.slice(0, 8).map(inv => (
                    <div key={inv.id} className="p-3 bg-accent/20 border border-border/50 rounded-lg flex items-center justify-between">
                       <div>
                         <div className="text-xs font-bold text-foreground mb-0.5">{inv.invoice_number || 'DRF-001'}</div>
                         <div className="text-[10px] text-muted-foreground">{inv.clients?.name || 'Unknown Client'}</div>
                       </div>
                       <div className="text-right">
                         <div className="text-sm font-bold">{currency(inv.amount)}</div>
                         <span className={`text-[9px] uppercase tracking-wider font-bold ${
                           inv.status === 'Paid' ? 'text-emerald-500' : 
                           inv.status === 'Sent' ? 'text-amber-500' : 
                           inv.status === 'Overdue' ? 'text-red-500' : 'text-muted-foreground'
                         }`}>{inv.status || 'Draft'}</span>
                       </div>
                    </div>
                  ))
                )}
             </div>
           </div>

           <div className="glass-card flex flex-col h-[500px]">
             <div className="p-4 border-b border-border/50 flex justify-between items-center bg-card/30">
               <h2 className="text-sm font-semibold flex items-center gap-2"><Receipt className="w-4 h-4 text-amber-500"/> Recent Expenses</h2>
               <Link href="/expenses" className="text-[10px] text-primary hover:underline font-bold tracking-wider uppercase">View Outlays</Link>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredExpenses.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-40">
                    <ArrowDownRight className="w-10 h-10 mb-3" />
                    <span className="text-xs">No expenses recorded yet</span>
                  </div>
                ) : (
                  filteredExpenses.slice(0, 8).map(exp => (
                    <div key={exp.id} className="p-3 bg-accent/20 border border-border/50 rounded-lg flex items-center justify-between">
                       <div>
                         <div className="text-xs font-bold text-foreground mb-0.5">{exp.description}</div>
                         <div className="text-[10px] text-muted-foreground">{exp.vendor_name || exp.category}</div>
                       </div>
                       <div className="text-right">
                         <div className="text-sm font-bold text-amber-500">{currency(exp.amount)}</div>
                         <div className="text-[10px] text-muted-foreground">{new Date(exp.expense_date).toLocaleDateString()}</div>
                       </div>
                    </div>
                  ))
                )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
