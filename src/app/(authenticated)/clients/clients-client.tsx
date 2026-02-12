"use client";

import { useState } from "react";
import Link from "next/link";
import type { Client } from "@/types/database";
import { Users, Search, ArrowRight, Plus, Heart } from "lucide-react";
import { ClientForm } from "@/components/forms/client-form";

export function ClientsList({ clients }: { clients: Client[] }) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const filtered = clients.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-border flex items-center px-6 bg-card/40 backdrop-blur-sm shrink-0 gap-4">
        <Users className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-foreground">Clients</span>
        <span className="text-xs text-muted-foreground">{filtered.length} total</span>
        <div className="ml-auto flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="h-8 pl-9 pr-3 bg-accent border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-48 transition-all"
            />
          </div>
          <button onClick={() => setShowForm(true)} className="btn-gradient px-3 py-1.5 text-xs flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> New Client
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No clients found.</p>
            <button onClick={() => setShowForm(true)} className="btn-gradient px-4 py-2 text-xs mt-4 inline-flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add your first client
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map((client) => (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <div className="glass-card p-5 group cursor-pointer">
                  <div className="flex items-center gap-3.5 mb-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold text-white shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${client.brand_primary}, ${client.brand_secondary})` }}
                    >
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {client.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Heart className="w-3 h-3" style={{ color: client.health_score >= 75 ? "oklch(0.72 0.20 155)" : client.health_score >= 50 ? "oklch(0.78 0.14 80)" : "oklch(0.63 0.24 25)" }} />
                        <span className={`text-[11px] font-semibold ${client.health_score >= 75 ? "health-excellent" : client.health_score >= 50 ? "health-warning" : "health-critical"}`}>
                          {client.health_score}%
                        </span>
                        {!client.is_active && <span className="text-[9px] bg-accent text-muted-foreground px-1.5 py-0.5 rounded">Inactive</span>}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {client.email && <div className="text-xs text-muted-foreground/50 truncate">{client.email}</div>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <ClientForm open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}
