"use client";

import { useState } from "react";
import type { AuditLog } from "@/types/database";
import { Shield, Search, AlertTriangle, Info, AlertCircle } from "lucide-react";

function timeAgo(ts: string) {
  const d = Date.now() - new Date(ts).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const levelIcon = { Critical: AlertTriangle, Warning: AlertCircle, Info: Info };
const levelCls = { Critical: "level-critical", Warning: "level-warning", Info: "level-info" };

export function LogsPage({ logs }: { logs: AuditLog[] }) {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const filtered = logs.filter((l) => {
    if (levelFilter !== "all" && l.level !== levelFilter) return false;
    if (search && !l.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-border flex items-center px-6 bg-card/40 backdrop-blur-sm shrink-0 gap-4">
        <Shield className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-foreground">Guardian Feed</span>
        <span className="text-xs text-muted-foreground">{filtered.length} entries</span>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex gap-1 p-0.5 bg-accent/30 rounded-lg">
            {["all", "Critical", "Warning", "Info"].map((lv) => (
              <button key={lv} onClick={() => setLevelFilter(lv)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${levelFilter === lv ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {lv === "all" ? "All" : lv}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
              className="h-8 pl-9 pr-3 bg-accent border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-40" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 fade-in">
        <div className="glass-card p-4">
          <div className="space-y-0.5 data-mono">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No logs found.</p>
            ) : filtered.map((log) => {
              const Icon = levelIcon[log.level] ?? Info;
              return (
                <div key={log.id} className="flex items-start gap-3 py-2 px-2 rounded hover:bg-accent/15 transition-colors">
                  <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${levelCls[log.level] ?? ""}`} />
                  <span className="text-[10px] text-muted-foreground/40 shrink-0 w-10">{timeAgo(log.timestamp)}</span>
                  <span className="text-xs text-foreground/80 flex-1">{log.message}</span>
                  <span className="text-[10px] text-muted-foreground/30">{log.source}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
