"use client";

import { useState, useEffect, useRef } from "react";
import { AlertCircle, Bell, Bot, CheckCircle2, ChevronRight, DollarSign, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRecentDelegations } from "@/lib/actions/delegation";
import { getCriticalAuditLogs } from "@/lib/actions/audit-logs";
import { getBudgetOverruns } from "@/lib/actions/projects";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Notification {
    id: string;
    type: "delegation" | "agent_report" | "audit_critical" | "budget_overrun";
    title: string;
    body: string;
    timestamp: string;
    read: boolean;
    link?: string;
    metadata?: any;
}

export function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const panelRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [isOpen]);

    // Fetch notifications from multiple sources
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const [delegations, auditLogs, overruns] = await Promise.all([
                    getRecentDelegations(10),
                    getCriticalAuditLogs(5),
                    getBudgetOverruns()
                ]);

                const delegNodes: Notification[] = (delegations as any[]).map((d) => ({
                    id: d.id,
                    type: "delegation" as const,
                    title: `${d.agent_id}: ${d.status === "completed" ? "Task completed" : d.status === "failed" ? "Task failed" : d.status === "in_progress" ? "Working on task" : "Task pending"}`,
                    body: d.tasks?.title || "Unknown task",
                    timestamp: d.delegated_at,
                    read: d.status === "completed" || d.status === "failed",
                    link: d.tasks?.project_id ? `/projects/${d.tasks.project_id}` : undefined,
                }));

                const auditNodes: Notification[] = (auditLogs as any[]).map((log) => ({
                    id: log.id,
                    type: "audit_critical" as const,
                    title: `System Alert: ${log.event_type || 'Error'}`,
                    body: log.description || "A critical system event occurred.",
                    timestamp: log.created_at,
                    read: false,
                    link: "/logs",
                }));

                const budgetNodes: Notification[] = (overruns as any[]).map((p) => ({
                    id: `overrun-${p.id}`,
                    type: "budget_overrun" as const,
                    title: `Budget Alert: ${p.name}`,
                    body: `Budget exceeded by $${p.overage.toLocaleString()}. Total spent: $${p.total_spent.toLocaleString()}.`,
                    timestamp: new Date().toISOString(), // Use current for simplicity as it's a dynamic check
                    read: false,
                    link: `/projects/${p.id}`,
                }));

                setNotifications([...budgetNodes, ...auditNodes, ...delegNodes].sort((a, b) => 
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                ));
            } catch (err) {
                console.error("Failed to fetch notifications:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();

        // Refresh every 60s
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Notifications"
            >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-card border border-border rounded-xl shadow-2xl z-[60] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <h3 className="text-sm font-semibold">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={markAllRead}>
                                    Mark all read
                                </Button>
                            )}
                            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Notification list */}
                    <div className="max-h-96 overflow-y-auto scrollbar-thin">
                        {loading ? (
                            <div className="py-8 text-center text-muted-foreground text-sm">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground text-sm">
                                <Bell className="w-6 h-6 mx-auto mb-2 opacity-20" />
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={cn(
                                        "flex items-start gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer",
                                        !notif.read && "bg-primary/5"
                                    )}
                                    onClick={() => {
                                        setNotifications(prev =>
                                            prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
                                        );
                                    }}
                                >
                                    {/* Icon */}
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                        notif.type === "delegation" ? "bg-purple-500/10 text-purple-500" :
                                        notif.type === "audit_critical" ? "bg-red-500/10 text-red-500" :
                                        notif.type === "budget_overrun" ? "bg-amber-500/10 text-amber-500" :
                                        "bg-blue-500/10 text-blue-500"
                                    )}>
                                        {notif.type === "delegation" ? <Bot className="w-4 h-4" /> :
                                         notif.type === "audit_critical" ? <AlertCircle className="w-4 h-4" /> :
                                         notif.type === "budget_overrun" ? <DollarSign className="w-4 h-4" /> :
                                         <CheckCircle2 className="w-4 h-4" />}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "text-sm",
                                            !notif.read ? "font-medium text-foreground" : "text-muted-foreground"
                                        )}>
                                            {notif.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">{notif.body}</p>
                                        <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                                            {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}
                                        </span>
                                    </div>

                                    {/* Link */}
                                    {notif.link && (
                                        <Link href={notif.link} className="text-muted-foreground hover:text-foreground shrink-0 mt-1">
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    )}

                                    {/* Unread dot */}
                                    {!notif.read && (
                                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-border text-center">
                            <Link
                                href="/agents"
                                className="text-xs text-primary hover:underline"
                                onClick={() => setIsOpen(false)}
                            >
                                View all in Agents →
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
