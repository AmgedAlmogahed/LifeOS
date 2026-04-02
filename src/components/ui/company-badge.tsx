"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Building2, User } from "lucide-react";

interface CompanyBadgeProps {
  account?: {
    name: string;
    primary_color?: string | null;
  } | null;
  size?: "sm" | "md";
  className?: string;
}

export function CompanyBadge({ account, size = "md", className }: CompanyBadgeProps) {
  const isPersonal = !account;
  const name = account?.name || "Personal";
  const color = account?.primary_color || "#94a3b8"; // Default slate-400 for personal

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-[11px] px-2.5 py-1 gap-1.5",
  };

  const iconSize = size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3";

  return (
    <div
      className={cn(
        "inline-flex items-center font-bold uppercase tracking-wider rounded-md border transition-all shadow-sm",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: `${color}15`, // 10-15% opacity background
        color: color,
        borderColor: `${color}30`,
      }}
    >
      {isPersonal ? (
        <User className={cn(iconSize)} />
      ) : (
        <Building2 className={cn(iconSize)} />
      )}
      {name}
    </div>
  );
}
