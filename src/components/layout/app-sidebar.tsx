"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  TrendingUp,
  FileText,
  Shield,
  Vault,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bot,
  Terminal,
  Calculator,
  Beaker,
  Rocket,
  DollarSign,
  CalendarDays,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { label: "Command Hub", href: "/dashboard", icon: LayoutDashboard, section: "cockpit" },
  { label: "Pipeline", href: "/pipeline", icon: TrendingUp, section: "cockpit" },
  { label: "Clients", href: "/clients", icon: Users, section: "cockpit" },
  { label: "Meetings", href: "/meetings", icon: CalendarDays, section: "cockpit" },
  { label: "Comms", href: "/comms", icon: MessageSquare, section: "cockpit" },
  { label: "The Forge", href: "/forge", icon: FolderKanban, section: "operations" },
  { label: "The Vault", href: "/vault", icon: Vault, section: "operations" },
  { label: "Generator Lab", href: "/generator", icon: Beaker, section: "operations" },
  { label: "Finance", href: "/finance", icon: DollarSign, section: "operations" },
  { label: "Deployments", href: "/deployments", icon: Rocket, section: "intel" },
  { label: "Agent Terminal", href: "/terminal", icon: Bot, section: "intel" },
  { label: "Guardian", href: "/logs", icon: Shield, section: "intel" },
  { label: "Leverage", href: "/leverage", icon: Calculator, section: "system" },
];

const sectionLabels: Record<string, string> = {
  cockpit: "Cockpit",
  operations: "Operations",
  intel: "Intelligence",
  system: "System",
};

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const sections = ["cockpit", "operations", "intel", "system"];

  return (
    <aside
      className={cn(
        "h-screen flex flex-col border-r border-border bg-sidebar transition-all duration-300 shrink-0",
        collapsed ? "w-[60px]" : "w-[230px]"
      )}
    >
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className="h-14 flex items-center px-3.5 border-b border-border shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/25 to-chart-3/15 border border-primary/20 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="text-sm font-bold gradient-text tracking-tight">
                Venture OS
              </span>
              <span className="block text-[10px] text-muted-foreground leading-none mt-0.5">
                Sovereign Foundation
              </span>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/25 to-chart-3/15 border border-primary/20 flex items-center justify-center mx-auto">
            <Terminal className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>

      {/* ─── Navigation ──────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-2.5 px-2">
        {sections.map((section) => {
          const items = navItems.filter((i) => i.section === section);
          return (
            <div key={section} className="mb-3">
              {!collapsed && (
                <div className="px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground/60 tracking-[0.15em] uppercase">
                  {sectionLabels[section]}
                </div>
              )}
              {collapsed && <div className="h-px bg-border mx-2 my-2" />}
              <div className="space-y-0.5 mt-0.5">
                {items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  const linkContent = (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] transition-all duration-200",
                        collapsed && "justify-center px-0",
                        isActive
                          ? "bg-primary/10 text-primary border border-primary/15 shadow-sm shadow-primary/5"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent"
                      )}
                    >
                      <Icon className={cn("w-[15px] h-[15px] shrink-0", isActive && "text-primary")} />
                      {!collapsed && (
                        <span className="truncate font-medium">{item.label}</span>
                      )}
                    </Link>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.href} delayDuration={0}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8}>{item.label}</TooltipContent>
                      </Tooltip>
                    );
                  }
                  return <div key={item.href}>{linkContent}</div>;
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ─── Agent Status ────────────────────────────────────────────── */}
      <div className="px-3 py-2 border-t border-border shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-accent/40">
            <Bot className="w-4 h-4 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground font-medium">Son of Anton</span>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 status-blink" />
              <span className="text-[10px] text-emerald-500/80">Active</span>
            </div>
          </div>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className="flex justify-center py-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 status-blink" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>Agent: Active</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* ─── Footer ──────────────────────────────────────────────────── */}
      <div className="px-2 py-2 border-t border-border flex items-center gap-1 shrink-0">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button onClick={handleLogout} className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>Logout</TooltipContent>
        </Tooltip>
        <div className="flex-1" />
        <button onClick={() => setCollapsed(!collapsed)} className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
