"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Zap,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AgentStatus = "online" | "syncing" | "offline";

interface SystemStatusProps {
  status: AgentStatus;
  lastSync?: string | null;
}

const statusDisplayMap: Record<
  AgentStatus,
  {
    label: string;
    description: string;
    color: string;
    bgColor: string;
    icon: React.ComponentType<{ className?: string }>;
    pulseColor: string;
  }
> = {
  online: {
    label: "ONLINE",
    description: "Son of Anton is connected and monitoring",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    icon: Wifi,
    pulseColor: "bg-emerald-400",
  },
  syncing: {
    label: "SYNCING",
    description: "Agent is pushing updates…",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    icon: RefreshCw,
    pulseColor: "bg-blue-400",
  },
  offline: {
    label: "OFFLINE",
    description: "Agent connection lost",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    icon: WifiOff,
    pulseColor: "bg-red-400",
  },
};

export function SystemStatus({
  status,
  lastSync,
}: SystemStatusProps) {
  const display = statusDisplayMap[status];
  const Icon = display.icon;

  const formattedSync = lastSync
    ? new Date(lastSync).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

  return (
    <Card className="bg-zinc-900/60 backdrop-blur-sm border-white/[0.06] overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Status Icon */}
          <div
            className={cn(
              "relative p-3 rounded-xl",
              display.bgColor
            )}
          >
            <Icon
              className={cn(
                "w-5 h-5",
                display.color,
                status === "syncing" && "animate-spin"
              )}
            />
            <div
              className={cn(
                "absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full",
                display.pulseColor,
                status !== "offline" && "animate-pulse"
              )}
            />
          </div>

          {/* Status Text */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Zap className={cn("w-3.5 h-3.5", display.color)} />
              <span
                className={cn(
                  "text-xs font-bold font-mono tracking-widest",
                  display.color
                )}
              >
                {display.label}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {display.description}
            </p>
          </div>

          {/* Last Sync */}
          <div className="text-right">
            <div className="flex items-center gap-1 text-zinc-500">
              <Clock className="w-3 h-3" />
              <span className="text-[10px] font-mono">Last sync</span>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              {formattedSync}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
