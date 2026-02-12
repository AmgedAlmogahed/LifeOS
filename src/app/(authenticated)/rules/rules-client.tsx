"use client";

import type { GuardianRule } from "@/types/database";
import { Shield, ShieldCheck, ShieldOff, AlertTriangle, Info } from "lucide-react";

const severityConfig: Record<string, { css: string; bg: string; border: string; icon: React.ReactNode }> = {
  Critical: {
    css: "level-critical",
    bg: "level-bg-critical",
    border: "border-red-500/20",
    icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
  },
  Warning: {
    css: "level-warning",
    bg: "level-bg-warning",
    border: "border-amber-500/20",
    icon: <Shield className="w-4 h-4 text-amber-500" />,
  },
  Info: {
    css: "level-info",
    bg: "level-bg-info",
    border: "border-border",
    icon: <Info className="w-4 h-4 text-muted-foreground" />,
  },
};

export function GuardianRulesPage({ rules }: { rules: GuardianRule[] }) {
  const activeRules = rules.filter((r) => r.is_active);
  const inactiveRules = rules.filter((r) => !r.is_active);

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-border flex items-center px-6 bg-card/50 backdrop-blur-sm shrink-0 gap-4">
        <Shield className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Guardian Rules</span>
        <span className="text-xs text-muted-foreground">
          {activeRules.length} active / {inactiveRules.length} inactive
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Rules</span>
          </div>

          {activeRules.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-sm text-muted-foreground">No active rules defined.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeRules.map((rule) => {
                const sev = severityConfig[rule.severity] ?? severityConfig.Info;
                return (
                  <div key={rule.id} className={`glass-card p-5 border-l-2 ${sev.border}`}>
                    <div className="flex items-start gap-3.5">
                      {sev.icon}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <h3 className="text-sm font-semibold text-foreground">{rule.name}</h3>
                          <span className={`text-[10px] font-semibold uppercase tracking-wider ${sev.css}`}>
                            {rule.severity}
                          </span>
                        </div>
                        {rule.description && (
                          <p className="text-xs text-muted-foreground mb-2">{rule.description}</p>
                        )}
                        <div className="text-xs text-muted-foreground/60 data-mono">
                          pattern: <span className="text-primary">{rule.pattern}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {inactiveRules.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ShieldOff className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inactive Rules</span>
            </div>
            <div className="space-y-3">
              {inactiveRules.map((rule) => (
                <div key={rule.id} className="glass-card p-5 opacity-40">
                  <h3 className="text-sm font-medium text-muted-foreground">{rule.name}</h3>
                  <div className="text-xs text-muted-foreground/50 data-mono mt-1">pattern: {rule.pattern}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
