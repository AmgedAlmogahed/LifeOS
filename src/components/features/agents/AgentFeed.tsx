"use client";

import { useEffect, useState } from "react";
import { getRecentDelegations } from "@/lib/actions/delegation";
import type { DelegationLogEntry, DelegationStatus } from "@/types/database";
import { Bot, CheckCircle2, Clock, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AgentFeedProps {
    limit?: number;
    agentFilter?: string;
    initialData?: any[];
}

const AGENT_COLORS: Record<string, string> = {
    Secretary: "bg-blue-500",
    Dev: "bg-green-500",
    Biz: "bg-purple-500",
    Creative: "bg-pink-500",
    Accounting: "bg-amber-500",
};

const STATUS_CONFIG: Record<DelegationStatus, { color: string; icon: typeof Clock; label: string }> = {
    pending: { color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Clock, label: "Pending" },
    in_progress: { color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Loader2, label: "In Progress" },
    completed: { color: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle2, label: "Completed" },
    failed: { color: "bg-red-500/10 text-red-600 border-red-500/20", icon: AlertCircle, label: "Failed" },
};

export function AgentFeed({ limit = 20, agentFilter, initialData }: AgentFeedProps) {
    const [entries, setEntries] = useState<any[]>(initialData || []);
    const [loading, setLoading] = useState(!initialData);

    useEffect(() => {
        if (initialData) return;
        
        const fetchData = async () => {
            try {
                const data = await getRecentDelegations(limit);
                setEntries(data);
            } catch (err) {
                console.error("Failed to load delegation log:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        // Auto-refresh every 30s
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [limit, agentFilter, initialData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <Bot className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No delegation activity yet</p>
            </div>
        );
    }

    const filteredEntries = agentFilter
        ? entries.filter((e: any) => e.agent_id === agentFilter)
        : entries;

    return (
        <div className="space-y-3">
            {filteredEntries.map((entry: any) => {
                const status = STATUS_CONFIG[entry.status as DelegationStatus] || STATUS_CONFIG.pending;
                const StatusIcon = status.icon;

                return (
                    <div
                        key={entry.id}
                        className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                    >
                        {/* Agent avatar */}
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
                            AGENT_COLORS[entry.agent_id] || "bg-gray-500"
                        )}>
                            {entry.agent_id?.[0] || "?"}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-foreground">
                                    {entry.agent_id}
                                </span>
                                <span className={cn(
                                    "text-[10px] px-2 py-0.5 rounded-full border font-medium",
                                    status.color
                                )}>
                                    <StatusIcon className={cn("w-3 h-3 inline mr-1", entry.status === "in_progress" && "animate-spin")} />
                                    {status.label}
                                </span>
                            </div>

                            {/* Task title */}
                            {entry.tasks && (
                                <p className="text-sm text-muted-foreground truncate mt-0.5">
                                    {entry.tasks.title}
                                </p>
                            )}

                            {/* Result summary */}
                            {entry.result_summary && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {entry.result_summary}
                                </p>
                            )}

                            {/* Timestamp */}
                            <span className="text-xs text-muted-foreground/60 mt-1 block">
                                {formatDistanceToNow(new Date(entry.delegated_at), { addSuffix: true })}
                            </span>
                        </div>

                        {/* Link to task */}
                        {entry.tasks?.project_id && (
                            <Link
                                href={`/projects/${entry.tasks.project_id}`}
                                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
