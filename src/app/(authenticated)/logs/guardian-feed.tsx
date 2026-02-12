"use client";

import { useState } from "react";
import type { AuditLog } from "@/types/database";
import { ScrollText, Search, Filter, Shield } from "lucide-react";

function formatTs(ts: string) {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function GuardianFeedPage({ logs }: { logs: AuditLog[] }) {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const filtered = logs.filter((l) => {
    if (search && !l.message.toLowerCase().includes(search.toLowerCase()) && !l.source.toLowerCase().includes(search.toLowerCase())) return false;
    if (levelFilter !== "all" && l.level !== levelFilter) return false;
    return true;
  });

  const counts = {
    Critical: logs.filter((l) => l.level === "Critical").length,
    Warning: logs.filter((l) => l.level === "Warning").length,
    Info: logs.filter((l) => l.level === "Info").length,
  };

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-border flex items-center px-6 bg-card/50 backdrop-blur-sm shrink-0 gap-4">
        <ScrollText className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-semibold text-foreground">Guardian Feed</span>

        <div className="flex items-center gap-4">
          {counts.Critical > 0 && <span className="text-xs font-medium level-critical">{counts.Critical} Critical</span>}
          {counts.Warning > 0 && <span className="text-xs font-medium level-warning">{counts.Warning} Warning</span>}
          <span className="text-xs text-muted-foreground">{counts.Info} Info</span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs..."
              className="h-8 pl-9 pr-3 bg-accent border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-48 transition-all"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="h-8 bg-accent border border-border rounded-lg text-sm text-foreground px-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">All Levels</option>
              <option value="Critical">Critical</option>
              <option value="Warning">Warning</option>
              <option value="Info">Info</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No log entries found.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.map((log) => (
              <div key={log.id} className="px-6 py-3 hover:bg-accent/30 transition-colors">
                <div className="data-mono">
                  <span className="text-muted-foreground/50">[{formatTs(log.timestamp)}]</span>{" "}
                  <span className={`font-semibold ${
                    log.level === "Critical" ? "level-critical" :
                    log.level === "Warning" ? "level-warning" : "level-info"
                  }`}>
                    {log.level.toUpperCase()}
                  </span>
                  <span className="text-muted-foreground/30">:</span>{" "}
                  <span className="text-foreground/90">{log.message}</span>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground/40 pl-1">
                  src: {log.source} · {timeAgo(log.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
