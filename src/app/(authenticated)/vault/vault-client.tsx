"use client";

import { useState } from "react";
import type { Client, PriceOffer, Contract, VaultSecret, Opportunity } from "@/types/database";
import { Shield, DollarSign, FileText, Lock, Plus } from "lucide-react";
import { PriceOfferForm } from "@/components/forms/price-offer-form";
import { ContractForm } from "@/components/forms/contract-form";

const currency = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
type Tab = "offers" | "contracts" | "secrets";

const offerStatusCls: Record<string, string> = {
  Draft: "stage-draft stage-bg-draft",
  Sent: "stage-sent stage-bg-sent",
  Accepted: "stage-won stage-bg-won",
  Rejected: "stage-lost stage-bg-lost",
  Expired: "text-muted-foreground bg-accent/30",
};
const contractStatusCls: Record<string, string> = {
  Draft: "stage-draft stage-bg-draft",
  "Pending Signature": "stage-negotiating stage-bg-negotiating",
  Active: "stage-won stage-bg-won",
  Completed: "text-muted-foreground bg-accent/30",
  Terminated: "stage-lost stage-bg-lost",
};

export function VaultDashboard({
  offers, contracts, clients, secrets, opportunities,
}: {
  offers: PriceOffer[];
  contracts: Contract[];
  clients: Client[];
  secrets: VaultSecret[];
  opportunities: Opportunity[];
}) {
  const [tab, setTab] = useState<Tab>("offers");
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [editOffer, setEditOffer] = useState<PriceOffer | null>(null);
  const [showContractForm, setShowContractForm] = useState(false);
  const [editContract, setEditContract] = useState<Contract | null>(null);

  const totalOffers = offers.reduce((s, o) => s + o.total_value, 0);
  const totalContracts = contracts.filter((c) => c.status === "Active").reduce((s, c) => s + c.total_value, 0);
  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]));

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-border flex items-center px-6 bg-card/40 backdrop-blur-sm shrink-0 gap-4">
        <Shield className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-foreground">The Vault</span>
        <span className="text-xs text-muted-foreground">Legal & Finance</span>
        <div className="ml-auto flex items-center gap-2">
          {tab === "offers" && (
            <button onClick={() => { setEditOffer(null); setShowOfferForm(true); }} className="btn-gradient px-3 py-1.5 text-xs flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> New Offer
            </button>
          )}
          {tab === "contracts" && (
            <button onClick={() => { setEditContract(null); setShowContractForm(true); }} className="btn-gradient px-3 py-1.5 text-xs flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> New Contract
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5 fade-in">
        {/* ─── KPIs ─────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card kpi-card p-4" style={{ "--kpi-accent": "var(--color-gold)" } as React.CSSProperties}>
            <div className="flex items-center gap-2 mb-2"><DollarSign className="w-5 h-5" style={{ color: "oklch(0.78 0.14 80)" }} /><span className="text-[11px] text-muted-foreground">Active Offers</span></div>
            <div className="text-2xl font-bold text-foreground">{currency(totalOffers)}</div>
            <div className="text-xs text-muted-foreground/60 mt-1">{offers.length} total offers</div>
          </div>
          <div className="glass-card kpi-card p-4" style={{ "--kpi-accent": "var(--color-revenue)" } as React.CSSProperties}>
            <div className="flex items-center gap-2 mb-2"><FileText className="w-5 h-5" style={{ color: "oklch(0.72 0.20 155)" }} /><span className="text-[11px] text-muted-foreground">Active Contracts</span></div>
            <div className="text-2xl font-bold text-foreground">{currency(totalContracts)}</div>
            <div className="text-xs text-muted-foreground/60 mt-1">{contracts.length} total contracts</div>
          </div>
          <div className="glass-card kpi-card p-4" style={{ "--kpi-accent": "oklch(0.65 0.22 310)" } as React.CSSProperties}>
            <div className="flex items-center gap-2 mb-2"><Lock className="w-5 h-5" style={{ color: "oklch(0.65 0.22 310)" }} /><span className="text-[11px] text-muted-foreground">Vault Secrets</span></div>
            <div className="text-2xl font-bold text-foreground">{secrets.length}</div>
            <div className="text-xs text-muted-foreground/60 mt-1">encrypted entries</div>
          </div>
        </div>

        {/* ─── Tabs ────────────────────────────────────────── */}
        <div className="flex gap-1 p-0.5 bg-accent/30 rounded-lg w-fit">
          {(["offers", "contracts", "secrets"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {t === "offers" ? "Price Offers" : t === "contracts" ? "Contracts" : "Secrets"}
            </button>
          ))}
        </div>

        {/* ─── Content ─────────────────────────────────────── */}
        <div className="glass-card p-5">
          {tab === "offers" && (
            offers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No price offers yet.</p>
                <button onClick={() => { setEditOffer(null); setShowOfferForm(true); }} className="btn-gradient px-4 py-2 text-xs mt-3 inline-flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Create your first offer
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {offers.map((offer) => (
                  <div key={offer.id} onClick={() => { setEditOffer(offer); setShowOfferForm(true); }}
                    className="flex items-center gap-4 py-3 px-3 rounded-lg hover:bg-accent/15 cursor-pointer transition-colors">
                    <DollarSign className="w-4 h-4 shrink-0" style={{ color: "oklch(0.78 0.14 80)" }} />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-foreground truncate">{offer.title}</h4>
                      <span className="text-[10px] text-muted-foreground/50">{clientMap[offer.client_id] ?? "Unknown"}</span>
                    </div>
                    <span className="text-sm font-bold gradient-text-gold">{currency(offer.total_value)}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${offerStatusCls[offer.status] ?? ""}`}>{offer.status}</span>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === "contracts" && (
            contracts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No contracts yet.</p>
                <button onClick={() => { setEditContract(null); setShowContractForm(true); }} className="btn-gradient px-4 py-2 text-xs mt-3 inline-flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Create your first contract
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {contracts.map((contract) => (
                  <div key={contract.id} onClick={() => { setEditContract(contract); setShowContractForm(true); }}
                    className="flex items-center gap-4 py-3 px-3 rounded-lg hover:bg-accent/15 cursor-pointer transition-colors">
                    <FileText className="w-4 h-4 shrink-0" style={{ color: "oklch(0.72 0.20 155)" }} />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-foreground truncate">{contract.title}</h4>
                      <span className="text-[10px] text-muted-foreground/50">{clientMap[contract.client_id] ?? "Unknown"}</span>
                    </div>
                    <span className="text-sm font-bold gradient-text-revenue">{currency(contract.total_value)}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${contractStatusCls[contract.status] ?? ""}`}>{contract.status}</span>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === "secrets" && (
            secrets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No vault secrets stored.</p>
            ) : (
              <div className="space-y-2">
                {secrets.map((s) => (
                  <div key={s.id} className="flex items-center gap-4 py-3 px-3 rounded-lg hover:bg-accent/15 transition-colors">
                    <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-foreground">{s.name}</h4>
                      <span className="text-[10px] text-muted-foreground/50">{s.description}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/30 data-mono">••••••••</span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      <PriceOfferForm
        open={showOfferForm}
        onClose={() => { setShowOfferForm(false); setEditOffer(null); }}
        clients={clients}
        opportunities={opportunities}
        editOffer={editOffer}
      />

      <ContractForm
        open={showContractForm}
        onClose={() => { setShowContractForm(false); setEditContract(null); }}
        clients={clients}
        editContract={editContract}
      />
    </div>
  );
}
