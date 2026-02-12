"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  ScrollText,
  Settings,
  Terminal,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Zap,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "System Logs", href: "/logs", icon: ScrollText },
];

const bottomNavItems: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-zinc-950 border-r border-white/[0.06] transition-all duration-300 ease-in-out",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 h-16 shrink-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-white/10">
          <Terminal className="w-4.5 h-4.5 text-blue-400" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h2 className="text-sm font-bold text-white tracking-tight truncate">
              Life OS
            </h2>
            <p className="text-[10px] text-zinc-500 font-mono truncate">
              COMMAND CENTER
            </p>
          </div>
        )}
      </div>

      <Separator className="bg-white/[0.06]" />

      {/* ─── Navigation ─────────────────────────────────────────────────────── */}
      <ScrollArea className="flex-1 py-3">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                  active
                    ? "bg-gradient-to-r from-blue-500/15 to-violet-500/10 text-white shadow-lg shadow-blue-500/5"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon
                  className={cn(
                    "w-[18px] h-[18px] shrink-0 transition-colors",
                    active
                      ? "text-blue-400"
                      : "text-zinc-500 group-hover:text-zinc-300"
                  )}
                />
                {!collapsed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {active && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    )}
                  </>
                )}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-zinc-800 text-white border-white/10">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{linkContent}</div>;
          })}
        </nav>
      </ScrollArea>

      {/* ─── Bottom Section ─────────────────────────────────────────────────── */}
      <div className="mt-auto border-t border-white/[0.06] pt-2 pb-3 px-2 space-y-1">
        {/* Agent Status Indicator */}
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg",
            collapsed ? "justify-center" : ""
          )}
        >
          <div className="relative">
            <Zap className="w-4 h-4 text-emerald-400" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-[11px] font-medium text-zinc-300">
                Son of Anton
              </p>
              <p className="text-[10px] text-emerald-400/80 font-mono">
                ONLINE
              </p>
            </div>
          )}
        </div>

        {bottomNavItems.map((item) => {
          const active = isActive(item.href);
          const linkContent = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                active
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              )}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" className="bg-zinc-800 text-white border-white/10">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return <div key={item.href}>{linkContent}</div>;
        })}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 w-full",
            collapsed ? "justify-center" : ""
          )}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* ─── Collapse Toggle ────────────────────────────────────────────────── */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-700 shadow-lg z-50"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </Button>
    </aside>
  );
}
