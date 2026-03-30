"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, CalendarClock, Inbox, Calendar,
  UserPlus, Users, GitBranch, FileText,
  FolderKanban, CheckSquare, Repeat,
  Receipt, Wallet, FileSignature,
  Bot, Rocket, ScrollText, Settings,
  X, ChevronRight, ChevronDown, Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyFilter, type CompanyFilter } from "@/components/providers/company-filter-context";
import { useState, useRef, useEffect } from "react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  inboxCount?: number;
}

const navGroups = [
  {
    label: "Command",
    items: [
      { href: "/cockpit", label: "Cockpit", icon: LayoutDashboard },
      { href: "/plan", label: "Plan", icon: CalendarClock },
      { href: "/inbox", label: "Inbox", icon: Inbox, badge: true },
      { href: "/calendar", label: "Calendar", icon: Calendar },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/leads", label: "Leads", icon: UserPlus },
      { href: "/clients", label: "Clients", icon: Users },
      { href: "/pipeline", label: "Pipeline", icon: GitBranch },
      { href: "/quotes", label: "Quotes", icon: FileText },
    ],
  },
  {
    label: "Projects",
    items: [
      { href: "/projects", label: "Projects", icon: FolderKanban },
      { href: "/tasks", label: "Tasks", icon: CheckSquare },
      { href: "/sprints", label: "Sprints", icon: Repeat },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/finance", label: "Invoices", icon: Receipt },
      { href: "/expenses", label: "Expenses", icon: Wallet },
      { href: "/contracts", label: "Contracts", icon: FileSignature },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/agents", label: "Agents", icon: Bot },
      { href: "/deployments", label: "Deployments", icon: Rocket },
      { href: "/logs", label: "Logs", icon: ScrollText },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

const companyOptions: { value: CompanyFilter; label: string; color: string }[] = [
  { value: "all", label: "All Companies", color: "bg-primary" },
  { value: "rabwatech", label: "Rabwatech", color: "bg-indigo-500" },
  { value: "lubb", label: "LUBB", color: "bg-emerald-500" },
  { value: "personal", label: "Personal", color: "bg-amber-500" },
];

export function Sidebar({ open, onClose, inboxCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const { selectedCompany, setSelectedCompany } = useCompanyFilter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [dropdownOpen]);

  const currentCompany = companyOptions.find((c) => c.value === selectedCompany) ?? companyOptions[0];

  return (
    <aside
      className={cn(
        "fixed top-14 left-0 bottom-0 z-50 bg-background border-r border-border flex flex-col",
        "transition-all duration-300 ease-in-out overflow-hidden",
        open ? "w-60" : "w-0"
      )}
    >
      {/* Scrollable nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 min-w-[240px]">
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
                    {"badge" in item && item.badge && inboxCount > 0 && (
                      <span className="ml-auto text-[10px] font-bold bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                        {inboxCount > 9 ? "9+" : inboxCount}
                      </span>
                    )}
                    {isActive && !("badge" in item && item.badge && inboxCount > 0) && (
                      <ChevronRight className="w-3 h-3 ml-auto text-primary/50" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Company Filter Dropdown */}
      <div className="border-t border-border p-3" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Building2 className="w-3.5 h-3.5 shrink-0" />
          <span className={cn("w-2 h-2 rounded-full shrink-0", currentCompany.color)} />
          <span className="truncate flex-1 text-left">{currentCompany.label}</span>
          <ChevronDown className={cn("w-3 h-3 transition-transform", dropdownOpen && "rotate-180")} />
        </button>

        {dropdownOpen && (
          <div className="mt-1 py-1 bg-card border border-border rounded-lg shadow-lg">
            {companyOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setSelectedCompany(opt.value);
                  setDropdownOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors",
                  selectedCompany === opt.value
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <span className={cn("w-2 h-2 rounded-full shrink-0", opt.color)} />
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <span className="text-[10px] text-muted-foreground/40 block text-center mt-2">LifeOS v1.0</span>
      </div>
    </aside>
  );
}
