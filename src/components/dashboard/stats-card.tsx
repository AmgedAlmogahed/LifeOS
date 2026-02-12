"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  color?: "blue" | "violet" | "emerald" | "amber" | "red";
}

const colorMap = {
  blue: {
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    glowColor: "shadow-blue-500/5",
  },
  violet: {
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
    glowColor: "shadow-violet-500/5",
  },
  emerald: {
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    glowColor: "shadow-emerald-500/5",
  },
  amber: {
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    glowColor: "shadow-amber-500/5",
  },
  red: {
    iconBg: "bg-red-500/10",
    iconColor: "text-red-400",
    glowColor: "shadow-red-500/5",
  },
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "blue",
}: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <Card
      className={cn(
        "bg-zinc-900/60 backdrop-blur-sm border-white/[0.06] hover:border-white/[0.1] transition-all duration-300 hover:shadow-xl",
        colors.glowColor
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
              {title}
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold text-white">{value}</p>
              {trend && (
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend.positive ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {trend.positive ? "+" : ""}
                  {trend.value}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[11px] text-zinc-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          <div className={cn("p-2.5 rounded-xl", colors.iconBg)}>
            <Icon className={cn("w-5 h-5", colors.iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
