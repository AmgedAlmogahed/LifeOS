"use client";

import { ArrowDownRight, Search, Plus, FileText } from "lucide-react";

export function ExpensesClient({ expenses = [], accounts = [] }: { expenses: any[], accounts: any[] }) {
  // A stub component for expense tracking logic until SQL migrations are fully integrated
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="h-16 border-b border-border flex items-center px-6 bg-card/40 backdrop-blur-sm shrink-0 gap-4">
        <ArrowDownRight className="w-5 h-5 text-amber-500" />
        <div>
           <h1 className="text-sm font-bold text-foreground leading-tight">Expense Tracker</h1>
           <span className="text-[10px] text-muted-foreground">{expenses.length} operating outlays</span>
        </div>
        
        <div className="ml-auto flex items-center gap-4">
          <button className="btn-gradient bg-amber-500 hover:bg-amber-600 px-4 py-1.5 text-xs flex items-center gap-1.5 shadow-sm">
            <Plus className="w-3.5 h-3.5" /> Log Expense
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 fade-in max-w-5xl mx-auto w-full">
         <div className="glass-card">
            <div className="p-4 border-b border-border/50 bg-card/30 flex items-center justify-between">
               <h2 className="text-sm font-semibold flex items-center gap-2"><FileText className="w-4 h-4 text-primary"/> Outlay Registry</h2>
               <div className="relative">
                 <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                 <input type="text" placeholder="Search expenses..." className="pl-9 pr-4 py-1 h-8 bg-accent/20 border border-border/50 rounded flex-1 focus:outline-none focus:border-amber-500/50 text-xs w-64" />
               </div>
            </div>
            {expenses.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground opacity-50">
                  <ArrowDownRight className="w-12 h-12 mb-4 text-amber-500/50" />
                  <span className="text-sm font-bold text-foreground">No Expenses Recorded</span>
                  <span className="text-xs max-w-xs mt-1">Start logging infrastructure, contractor, or service expenses to compute your profit margins.</span>
               </div>
            ) : (
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-accent/10 border-b border-border text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                     <th className="p-3">Entity</th>
                     <th className="p-3">Description</th>
                     <th className="p-3">Category</th>
                     <th className="p-3">Vendor</th>
                     <th className="p-3 text-right">Amount</th>
                     <th className="p-3 text-right">Date</th>
                   </tr>
                 </thead>
                 <tbody className="text-xs">
                    {expenses.map(e => (
                       <tr key={e.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                          <td className="p-3 font-medium">{e.accounts?.name || '—'}</td>
                          <td className="p-3 text-foreground">{e.description}</td>
                          <td className="p-3">
                             <span className="px-2 py-0.5 rounded-full bg-accent/40 font-semibold">{e.category}</span>
                          </td>
                          <td className="p-3 text-muted-foreground">{e.vendor_name || '—'}</td>
                          <td className="p-3 text-right font-bold text-amber-500">${e.amount?.toFixed(2)}</td>
                          <td className="p-3 text-right text-muted-foreground">{new Date(e.expense_date).toLocaleDateString()}</td>
                       </tr>
                    ))}
                 </tbody>
               </table>
            )}
         </div>
      </div>
    </div>
  );
}
