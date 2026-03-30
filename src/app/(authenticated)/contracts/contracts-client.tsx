"use client";

import { useState } from "react";
import type { Client, Contract } from "@/types/database";
import { FileSignature, FileText, Plus } from "lucide-react";
import { ContractForm } from "@/components/forms/contract-form";

const currency = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

const contractStatusCls: Record<string, string> = {
  Draft: "stage-draft stage-bg-draft",
  "Pending Signature": "stage-negotiating stage-bg-negotiating",
  Active: "stage-won stage-bg-won",
  Completed: "text-muted-foreground bg-accent/30",
  Terminated: "stage-lost stage-bg-lost",
};

export function ContractsClient({
  contracts,
  clients,
}: {
  contracts: Contract[];
  clients: Client[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [editContract, setEditContract] = useState<Contract | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]));
  const totalActive = contracts
    .filter((c) => c.status === "Active")
    .reduce((s, c) => s + c.total_value, 0);

  const filtered = statusFilter === "all"
    ? contracts
    : contracts.filter((c) => c.status === statusFilter);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center px-6 bg-card/40 backdrop-blur-sm shrink-0 gap-4">
        <FileSignature className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-foreground">Contracts</span>
        <span className="text-xs text-muted-foreground">{contracts.length} total</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => { setEditContract(null); setShowForm(true); }}
            className="btn-gradient px-3 py-1.5 text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> New Contract
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5 fade-in">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card kpi-card p-4" style={{ "--kpi-accent": "var(--color-revenue)" } as React.CSSProperties}>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5" style={{ color: "oklch(0.72 0.20 155)" }} />
              <span className="text-[11px] text-muted-foreground">Active Value</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{currency(totalActive)}</div>
            <div className="text-xs text-muted-foreground/60 mt-1">
              {contracts.filter((c) => c.status === "Active").length} active contracts
            </div>
          </div>
          <div className="glass-card kpi-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileSignature className="w-5 h-5 text-amber-500" />
              <span className="text-[11px] text-muted-foreground">Pending Signature</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {contracts.filter((c) => c.status === "Pending Signature").length}
            </div>
            <div className="text-xs text-muted-foreground/60 mt-1">awaiting signature</div>
          </div>
          <div className="glass-card kpi-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">Total Contracts</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{contracts.length}</div>
            <div className="text-xs text-muted-foreground/60 mt-1">all time</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-1 p-0.5 bg-accent/30 rounded-lg w-fit">
          {["all", "Draft", "Pending Signature", "Active", "Completed", "Terminated"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
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
              <p className="text-sm text-muted-foreground">No contracts found.</p>
              <button
                onClick={() => { setEditContract(null); setShowForm(true); }}
                className="btn-gradient px-4 py-2 text-xs mt-3 inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Create your first contract
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((contract) => (
                <div
                  key={contract.id}
                  onClick={() => { setEditContract(contract); setShowForm(true); }}
                  className="flex items-center gap-4 py-3 px-3 rounded-lg hover:bg-accent/15 cursor-pointer transition-colors"
                >
                  <FileText className="w-4 h-4 shrink-0" style={{ color: "oklch(0.72 0.20 155)" }} />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground truncate">{contract.title}</h4>
                    <span className="text-[10px] text-muted-foreground/50">
                      {clientMap[contract.client_id] ?? "Unknown"}
                    </span>
                  </div>
                  <span className="text-sm font-bold gradient-text-revenue">{currency(contract.total_value)}</span>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${contractStatusCls[contract.status] ?? ""}`}
                  >
                    {contract.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ContractForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditContract(null); }}
        clients={clients}
        editContract={editContract}
      />
    </div>
  );
}
