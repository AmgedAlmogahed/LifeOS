"use client";

import { useState } from "react";
import { FileText, Plus, Search, CheckCircle, Download, Clock } from "lucide-react";

function currency(v: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v); }

export function QuotesClient({ quotes = [], accounts = [] }: { quotes: any[], accounts: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredQuotes = quotes.filter(q => 
    q.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    q.clients?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="h-16 border-b border-border flex items-center px-6 bg-card/40 backdrop-blur-sm shrink-0 gap-4">
        <FileText className="w-5 h-5 text-indigo-500" />
        <div>
           <h1 className="text-sm font-bold text-foreground leading-tight">Quotation Engine</h1>
           <span className="text-[10px] text-muted-foreground">{quotes.length} price offers tracked</span>
        </div>
        
        <div className="ml-auto flex items-center gap-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by client or title..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 h-8 bg-accent/20 border border-border/50 rounded-lg text-xs w-64 focus:outline-none focus:border-indigo-500/50" 
            />
          </div>
          <button className="btn-gradient bg-indigo-500 hover:bg-indigo-600 px-4 py-1.5 text-xs flex items-center gap-1.5 shadow-sm">
            <Plus className="w-3.5 h-3.5" /> Build Quote
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 fade-in max-w-6xl mx-auto w-full">
         <div className="glass-card">
            {filteredQuotes.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground opacity-50">
                  <FileText className="w-12 h-12 mb-4 text-indigo-500/50" />
                  <span className="text-sm font-bold text-foreground">No Quotations Yet</span>
                  <span className="text-xs max-w-xs mt-1">Start drafting proposals to pitch your services. They will securely save here.</span>
               </div>
            ) : (
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-accent/10 border-b border-border text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                     <th className="p-4">Title & Description</th>
                     <th className="p-4">Client</th>
                     <th className="p-4">Total Value</th>
                     <th className="p-4">Status</th>
                     <th className="p-4 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="text-xs">
                    {filteredQuotes.map(q => (
                       <tr key={q.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors group cursor-pointer">
                          <td className="p-4">
                             <div className="font-semibold text-foreground group-hover:text-primary transition-colors">{q.title}</div>
                             <div className="text-[10px] text-muted-foreground mt-0.5 max-w-[300px] truncate">{q.notes || 'No description provided.'}</div>
                          </td>
                          <td className="p-4 font-medium text-muted-foreground">{q.clients?.name || '—'}</td>
                          <td className="p-4">
                             <div className="font-bold text-foreground">{currency(q.total_value)}</div>
                             {q.vat_type && q.vat_type !== 'None' && <div className="text-[9px] text-muted-foreground">Incl. {q.vat_type} VAT</div>}
                          </td>
                          <td className="p-4">
                             <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${
                               q.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                               q.status === 'Sent' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                               q.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                               'bg-accent text-muted-foreground border-border/50'
                             }`}>
                               {q.status}
                             </span>
                          </td>
                          <td className="p-4 text-right">
                             <div className="flex flex-col items-end gap-2">
                               {q.pdf_url ? (
                                  <a href={q.pdf_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[10px] font-semibold text-primary hover:underline">
                                    <Download className="w-3 h-3" /> View PDF
                                  </a>
                               ) : (
                                  <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
                                    <Clock className="w-3 h-3" /> No PDF
                                  </span>
                               )}
                             </div>
                          </td>
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
