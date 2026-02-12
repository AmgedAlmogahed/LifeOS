"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AuditLog, AuditLevel } from "@/types/database";
import { Shield, AlertTriangle, Info, Bell } from "lucide-react";

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

interface GuardianFeedProps {
  logs: AuditLog[];
}

function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function GuardianFeed({ logs }: GuardianFeedProps) {
  return (
    <Card className="bg-zinc-900/60 backdrop-blur-sm border-white/[0.06] overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-500/10">
              <Shield className="w-4 h-4 text-red-400" />
            </div>
            <CardTitle className="text-sm font-semibold text-white">
              Guardian Feed
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] text-zinc-500 border-zinc-700">
            {logs.length} entries
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[380px] pr-2">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-600">
              <Shield className="w-8 h-8 mb-2 text-zinc-700" />
              <p className="text-sm">All clear — no alerts</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => {
                const config = levelConfig[log.level];
                const Icon = config.icon;
                return (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg border ${config.border} ${config.bg} transition-all hover:scale-[1.01]`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon
                        className={`w-4 h-4 mt-0.5 shrink-0 ${config.color}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-200 leading-relaxed">
                          {log.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] font-mono text-zinc-500">
                            {log.source}
                          </span>
                          <span className="text-[10px] text-zinc-600">•</span>
                          <span className="text-[10px] text-zinc-500">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[9px] shrink-0 ${config.color} border-current/20`}
                      >
                        {log.level}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
