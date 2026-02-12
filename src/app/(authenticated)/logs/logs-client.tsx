"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AuditLog, AuditLevel } from "@/types/database";
import {
  ScrollText,
  Search,
  Filter,
  AlertTriangle,
  Bell,
  Info,
  Clock,
} from "lucide-react";

const levelConfig: Record<
  AuditLevel,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bg: string;
    border: string;
  }
> = {
  Critical: {
    icon: AlertTriangle,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  Warning: {
    icon: Bell,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  Info: {
    icon: Info,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
};

interface LogsClientProps {
  logs: AuditLog[];
}

export function LogsClient({ logs }: LogsClientProps) {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const filtered = logs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(search.toLowerCase()) ||
      log.source.toLowerCase().includes(search.toLowerCase());
    const matchesLevel =
      levelFilter === "all" || log.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          System Logs
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Audit trail from Son of Anton and system operations.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-zinc-900/60 border-white/[0.06] text-white placeholder:text-zinc-600 h-10"
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[160px] bg-zinc-900/60 border-white/[0.06] text-zinc-300 h-10">
            <Filter className="w-4 h-4 mr-2 text-zinc-500" />
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-white/[0.06]">
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
            <SelectItem value="Warning">Warning</SelectItem>
            <SelectItem value="Info">Info</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <span className="font-mono">
          {filtered.length} log{filtered.length !== 1 ? "s" : ""}
        </span>
        <span className="text-red-400/80">
          {logs.filter((l) => l.level === "Critical").length} critical
        </span>
        <span className="text-amber-400/80">
          {logs.filter((l) => l.level === "Warning").length} warnings
        </span>
        <span className="text-blue-400/80">
          {logs.filter((l) => l.level === "Info").length} info
        </span>
      </div>

      {/* Log List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
          <ScrollText className="w-12 h-12 mb-3 text-zinc-700" />
          <p className="text-sm font-medium">No logs found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((log) => {
            const config = levelConfig[log.level];
            const Icon = config.icon;
            return (
              <Card
                key={log.id}
                className={`bg-zinc-900/60 backdrop-blur-sm border-white/[0.06] hover:border-white/[0.1] transition-all duration-200 p-4`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-md mt-0.5 ${config.bg}`}>
                    <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 leading-relaxed">
                      {log.message}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[11px] font-mono text-zinc-500">
                        {log.source}
                      </span>
                      <span className="text-[11px] text-zinc-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.timestamp).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] shrink-0 ${config.color} ${config.border} ${config.bg}`}
                  >
                    {log.level}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
