"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Zap, ListTodo, CalendarDays, Moon, CalendarCheck, Inbox, Hammer,
  Users, TrendingUp, DollarSign, MessageSquare, Handshake,
  FolderKanban, Rocket, ScrollText, ShieldCheck, Wrench, Terminal,
  Sparkles, Lock, X, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  inboxCount?: number;
}

const navGroups = [
  {
    label: "Workflow",
    items: [
      { href: "/cockpit", label: "Cockpit", icon: Zap },
      { href: "/tasks", label: "All Tasks", icon: ListTodo },
      { href: "/calendar", label: "Calendar", icon: CalendarDays },
      { href: "/plan", label: "Daily Plan", icon: CalendarCheck },
      { href: "/inbox", label: "Inbox", icon: Inbox },
    ],
  },
  {
    label: "Projects",
    items: [
      { href: "/forge", label: "Forge", icon: Hammer },
      { href: "/projects", label: "Projects", icon: FolderKanban },
      { href: "/deployments", label: "Deployments", icon: Rocket },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/pipeline", label: "Pipeline", icon: TrendingUp },
      { href: "/clients", label: "Clients", icon: Users },
      { href: "/finance", label: "Finance", icon: DollarSign },
      { href: "/comms", label: "Communications", icon: MessageSquare },
      { href: "/meetings", label: "Meetings", icon: Handshake },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/logs", label: "Audit Logs", icon: ScrollText },
      { href: "/rules", label: "Guardian Rules", icon: ShieldCheck },
      { href: "/leverage", label: "Leverage", icon: Sparkles },
      { href: "/vault", label: "Vault", icon: Lock },
      { href: "/terminal", label: "Terminal", icon: Terminal },
      { href: "/settings", label: "Settings", icon: Wrench },
    ],
  },
];

export function Sidebar({ open, onClose, inboxCount = 0 }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed top-14 left-0 bottom-0 z-50 bg-background border-r border-border flex flex-col",
        "transition-all duration-300 ease-in-out overflow-hidden",
        open ? "w-60" : "w-0"
      )}
    >
      {/* Scrollable nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 min-w-[240px]">
        {navGroups.map((group) => (
          <div key={group.label}>
            <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-3 mb-2 block">
              {group.label}
            </span>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0", isActive && "text-primary")} />
                    <span className="truncate">{item.label}</span>
                    {item.href === "/inbox" && inboxCount > 0 && (
                      <span className="ml-auto text-[10px] font-bold bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                        {inboxCount > 9 ? "9+" : inboxCount}
                      </span>
                    )}
                    {isActive && (
                      <ChevronRight className="w-3 h-3 ml-auto text-primary/50" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3">
        <span className="text-[10px] text-muted-foreground/40 block text-center">LifeOS v1.0</span>
      </div>
    </aside>
  );
}
