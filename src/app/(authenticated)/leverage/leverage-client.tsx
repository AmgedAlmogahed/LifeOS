"use client";

import type { LeverageLog } from "@/types/database";
import { Calculator, Clock, Zap, DollarSign } from "lucide-react";

function currency(v: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v); }

export function LeveragePage({ logs }: { logs: LeverageLog[] }) {
  const now = Date.now();
  const weekLogs = logs.filter((l) => new Date(l.timestamp).getTime() >= now - 7 * 86400000);
  const monthLogs = logs.filter((l) => new Date(l.timestamp).getTime() >= now - 30 * 86400000);
  const totalHours = logs.reduce((s, l) => s + Number(l.hours_saved), 0);
  const weekHours = weekLogs.reduce((s, l) => s + Number(l.hours_saved), 0);
  const monthHours = monthLogs.reduce((s, l) => s + Number(l.hours_saved), 0);
  const hourlyValue = 150;

  // 7-day bar chart
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now - (6 - i) * 86400000);
    const key = date.toISOString().split("T")[0];
    const dayLogs = logs.filter((l) => l.timestamp.startsWith(key));
    const hours = dayLogs.reduce((s, l) => s + Number(l.hours_saved), 0);
    return { label: date.toLocaleDateString("en", { weekday: "short" }), hours };
  });
  const maxH = Math.max(...days.map((d) => d.hours), 1);

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-border flex items-center px-6 bg-card/40 backdrop-blur-sm shrink-0 gap-4">
        <Calculator className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-foreground">Leverage Calculator</span>
        <span className="text-xs text-muted-foreground">{logs.length} entries</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5 fade-in">
        {/* ─── KPIs ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4">
          <div className="glass-card kpi-card p-4" style={{ "--kpi-accent": "var(--color-gold)" } as React.CSSProperties}>
            <div className="flex items-center gap-2 mb-2"><Zap className="w-5 h-5" style={{ color: "oklch(0.78 0.14 80)" }} /><span className="text-[11px] text-muted-foreground">This Week</span></div>
            <div className="text-2xl font-bold text-foreground">{weekHours.toFixed(1)}h</div>
            <div className="text-xs text-muted-foreground/60 mt-1">{currency(weekHours * hourlyValue)} saved</div>
          </div>
          <div className="glass-card kpi-card p-4" style={{ "--kpi-accent": "var(--color-pipeline)" } as React.CSSProperties}>
            <div className="flex items-center gap-2 mb-2"><Clock className="w-5 h-5 text-primary" /><span className="text-[11px] text-muted-foreground">This Month</span></div>
            <div className="text-2xl font-bold text-foreground">{monthHours.toFixed(1)}h</div>
            <div className="text-xs text-muted-foreground/60 mt-1">{currency(monthHours * hourlyValue)} saved</div>
          </div>
          <div className="glass-card kpi-card p-4" style={{ "--kpi-accent": "var(--color-revenue)" } as React.CSSProperties}>
            <div className="flex items-center gap-2 mb-2"><DollarSign className="w-5 h-5" style={{ color: "oklch(0.72 0.20 155)" }} /><span className="text-[11px] text-muted-foreground">All Time</span></div>
            <div className="text-2xl font-bold text-foreground">{totalHours.toFixed(1)}h</div>
            <div className="text-xs text-muted-foreground/60 mt-1">{currency(totalHours * hourlyValue)} saved</div>
          </div>
          <div className="glass-card kpi-card p-4" style={{ "--kpi-accent": "oklch(0.65 0.22 310)" } as React.CSSProperties}>
            <div className="flex items-center gap-2 mb-2"><Calculator className="w-5 h-5" style={{ color: "oklch(0.65 0.22 310)" }} /><span className="text-[11px] text-muted-foreground">Hourly Rate</span></div>
            <div className="text-2xl font-bold text-foreground">{currency(hourlyValue)}</div>
            <div className="text-xs text-muted-foreground/60 mt-1">per hour</div>
          </div>
        </div>

        {/* ─── 7-Day Chart ─────────────────────────────────────── */}
        <div className="glass-card p-5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">7-Day Trend</h2>
          <div className="flex items-end gap-3 h-36">
            {days.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground data-mono">{d.hours.toFixed(1)}h</span>
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-md transition-all duration-500"
                    style={{
                      height: `${Math.max((d.hours / maxH) * 100, 4)}%`,
                      background: `linear-gradient(180deg, oklch(0.70 0.19 265), oklch(0.55 0.22 310))`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground/50">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Log List ────────────────────────────────────────── */}
        <div className="glass-card p-5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Activity</h2>
          {logs.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No leverage entries.</p>
          ) : (
            <div className="space-y-1.5">
              {logs.slice(0, 20).map((l) => (
                <div key={l.id} className="flex items-center gap-3 py-2 px-2 rounded hover:bg-accent/15 transition-colors">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-xs text-foreground/80 flex-1">{l.description}</span>
                  <span className="text-xs font-bold text-foreground">{Number(l.hours_saved).toFixed(1)}h</span>
                  <span className="text-[10px] text-muted-foreground/40">{new Date(l.timestamp).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
