"use client";

import { useState } from "react";
import { Settings, Building2, Lock, Shield, BookOpen, Palette } from "lucide-react";

type Tab = "companies" | "vault" | "rules" | "catalog" | "preferences";

const tabs: { key: Tab; label: string; icon: typeof Building2 }[] = [
  { key: "companies", label: "Companies", icon: Building2 },
  { key: "vault", label: "Vault", icon: Lock },
  { key: "rules", label: "Rules", icon: Shield },
  { key: "catalog", label: "Service Catalog", icon: BookOpen },
  { key: "preferences", label: "Preferences", icon: Palette },
];

export function SettingsClient({
  accounts,
  secrets,
  rules,
  services,
}: {
  accounts: any[];
  secrets: any[];
  rules: any[];
  services: any[];
}) {
  const [tab, setTab] = useState<Tab>("companies");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center px-6 bg-card/40 backdrop-blur-sm shrink-0 gap-4">
        <Settings className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-foreground">Settings</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5 fade-in">
        {/* Tabs */}
        <div className="flex gap-1 p-0.5 bg-accent/30 rounded-lg w-fit">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                tab === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Companies */}
        {tab === "companies" && (
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" /> Company Profiles
            </h3>
            {accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No companies configured. Add your first company profile.</p>
            ) : (
              <div className="space-y-3">
                {accounts.map((acc) => (
                  <div key={acc.id} className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {acc.name?.charAt(0) ?? "?"}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-foreground">{acc.name}</h4>
                      <span className="text-[10px] text-muted-foreground/60">{acc.legal_name || "No legal name set"}</span>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${acc.is_active !== false ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                      {acc.is_active !== false ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vault / Secrets */}
        {tab === "vault" && (
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" /> Secrets Management
            </h3>
            {secrets.length === 0 ? (
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
            )}
          </div>
        )}

        {/* Rules */}
        {tab === "rules" && (
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Guardian Rules
            </h3>
            {rules.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No guardian rules configured.</p>
            ) : (
              <div className="space-y-2">
                {rules.map((rule) => (
                  <div key={rule.id} className="flex items-center gap-4 py-3 px-3 rounded-lg hover:bg-accent/15 transition-colors">
                    <Shield className="w-4 h-4 text-amber-500 shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-foreground">{rule.name || rule.rule_type || "Rule"}</h4>
                      <span className="text-[10px] text-muted-foreground/50">{rule.description || rule.condition || ""}</span>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${rule.is_active !== false ? "bg-emerald-500/10 text-emerald-500" : "bg-accent/30 text-muted-foreground"}`}>
                      {rule.is_active !== false ? "Active" : "Disabled"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Service Catalog */}
        {tab === "catalog" && (
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> Service Catalog
            </h3>
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No services in the catalog.</p>
            ) : (
              <div className="space-y-2">
                {services.map((svc) => (
                  <div key={svc.id} className="flex items-center gap-4 py-3 px-3 rounded-lg hover:bg-accent/15 transition-colors">
                    <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-foreground">{svc.name}</h4>
                      <span className="text-[10px] text-muted-foreground/50">{svc.description || ""}</span>
                    </div>
                    {svc.base_price && (
                      <span className="text-xs font-bold text-foreground/70">
                        {Number(svc.base_price).toLocaleString()} SAR
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Preferences */}
        {tab === "preferences" && (
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" /> Preferences
            </h3>
            <p className="text-sm text-muted-foreground text-center py-8">
              Preferences configuration coming soon. This will include theme, defaults, and notification settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
