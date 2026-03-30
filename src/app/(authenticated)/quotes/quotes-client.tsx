"use client";

import { useState } from "react";
import type { Client, PriceOffer, Opportunity } from "@/types/database";
import { FileText, DollarSign, Plus } from "lucide-react";
import { PriceOfferForm } from "@/components/forms/price-offer-form";

const currency = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

const offerStatusCls: Record<string, string> = {
  Draft: "stage-draft stage-bg-draft",
  Sent: "stage-sent stage-bg-sent",
  Accepted: "stage-won stage-bg-won",
  Rejected: "stage-lost stage-bg-lost",
  Expired: "text-muted-foreground bg-accent/30",
};

export function QuotesClient({
  offers,
  clients,
  opportunities,
}: {
  offers: PriceOffer[];
  clients: Client[];
  opportunities: Opportunity[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [editOffer, setEditOffer] = useState<PriceOffer | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]));
  const totalValue = offers.reduce((s, o) => s + o.total_value, 0);

  const filtered = statusFilter === "all"
    ? offers
    : offers.filter((o) => o.status === statusFilter);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center px-6 bg-card/40 backdrop-blur-sm shrink-0 gap-4">
        <FileText className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-foreground">Quotes</span>
        <span className="text-xs text-muted-foreground">Price Offers & Proposals</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => { setEditOffer(null); setShowForm(true); }}
            className="btn-gradient px-3 py-1.5 text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> New Quote
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5 fade-in">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card kpi-card p-4" style={{ "--kpi-accent": "var(--color-gold)" } as React.CSSProperties}>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5" style={{ color: "oklch(0.78 0.14 80)" }} />
              <span className="text-[11px] text-muted-foreground">Total Quoted</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{currency(totalValue)}</div>
            <div className="text-xs text-muted-foreground/60 mt-1">{offers.length} total quotes</div>
          </div>
          <div className="glass-card kpi-card p-4" style={{ "--kpi-accent": "var(--color-revenue)" } as React.CSSProperties}>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5" style={{ color: "oklch(0.72 0.20 155)" }} />
              <span className="text-[11px] text-muted-foreground">Accepted</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {currency(offers.filter((o) => o.status === "Accepted").reduce((s, o) => s + o.total_value, 0))}
            </div>
            <div className="text-xs text-muted-foreground/60 mt-1">
              {offers.filter((o) => o.status === "Accepted").length} won
            </div>
          </div>
          <div className="glass-card kpi-card p-4" style={{ "--kpi-accent": "oklch(0.78 0.14 80)" } as React.CSSProperties}>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-amber-500" />
              <span className="text-[11px] text-muted-foreground">Pending</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {currency(offers.filter((o) => ["Draft", "Sent"].includes(o.status)).reduce((s, o) => s + o.total_value, 0))}
            </div>
            <div className="text-xs text-muted-foreground/60 mt-1">
              {offers.filter((o) => ["Draft", "Sent"].includes(o.status)).length} open
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-1 p-0.5 bg-accent/30 rounded-lg w-fit">
          {["all", "Draft", "Sent", "Accepted", "Rejected", "Expired"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                statusFilter === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="glass-card p-5">
          {filtered.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No quotes found.</p>
              <button
                onClick={() => { setEditOffer(null); setShowForm(true); }}
                className="btn-gradient px-4 py-2 text-xs mt-3 inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Create your first quote
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((offer) => (
                <div
                  key={offer.id}
                  onClick={() => { setEditOffer(offer); setShowForm(true); }}
                  className="flex items-center gap-4 py-3 px-3 rounded-lg hover:bg-accent/15 cursor-pointer transition-colors"
                >
                  <DollarSign className="w-4 h-4 shrink-0" style={{ color: "oklch(0.78 0.14 80)" }} />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground truncate">{offer.title}</h4>
                    <span className="text-[10px] text-muted-foreground/50">
                      {clientMap[offer.client_id] ?? "Unknown"}
                    </span>
                  </div>
                  <span className="text-sm font-bold gradient-text-gold">{currency(offer.total_value)}</span>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${offerStatusCls[offer.status] ?? ""}`}
                  >
                    {offer.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <PriceOfferForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditOffer(null); }}
        clients={clients}
        opportunities={opportunities}
        editOffer={editOffer}
      />
    </div>
  );
}
