"use client";

import { Heart, TrendingUp, TrendingDown, Minus, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentReport } from "@/types/database";
import { formatDistanceToNow } from "date-fns";

interface ClientHealthCardProps {
    healthScore: number;
    agentReports: AgentReport[];
    clientName: string;
}

function getHealthConfig(score: number) {
    if (score >= 80) return { label: "Excellent", color: "text-emerald-500", bg: "bg-emerald-500", ring: "ring-emerald-500/20", icon: TrendingUp };
    if (score >= 60) return { label: "Good", color: "text-amber-500", bg: "bg-amber-500", ring: "ring-amber-500/20", icon: Minus };
    return { label: "At Risk", color: "text-red-500", bg: "bg-red-500", ring: "ring-red-500/20", icon: TrendingDown };
}

export function ClientHealthCard({ healthScore, agentReports, clientName }: ClientHealthCardProps) {
    const config = getHealthConfig(healthScore);
    const StatusIcon = config.icon;

    // Recent communications from agent reports
    const communications = agentReports
        .filter(r => r.report_type === "communication" || r.report_type === "meeting_note")
        .slice(0, 5);

    const criticalAlerts = agentReports.filter(r => r.severity === "critical" && !r.is_resolved);
    const warnings = agentReports.filter(r => r.severity === "warning" && !r.is_resolved);

    return (
        <div className="space-y-4">
            {/* Health Score Gauge */}
            <div className="glass-card p-5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Heart className="w-3.5 h-3.5" /> Client Health
                </h3>

                <div className="flex items-center gap-6">
                    {/* Radial gauge */}
                    <div className="relative w-24 h-24 shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            {/* Background ring */}
                            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor"
                                    className="text-muted/20" strokeWidth="8" />
                            {/* Score ring */}
                            <circle cx="50" cy="50" r="42" fill="none"
                                    className={config.color}
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(healthScore / 100) * 264} 264`}
                                    style={{ transition: "stroke-dasharray 0.8s ease" }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={cn("text-2xl font-bold", config.color)}>{healthScore}</span>
                            <span className="text-[9px] text-muted-foreground">/ 100</span>
                        </div>
                    </div>

                    {/* Status summary */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <StatusIcon className={cn("w-4 h-4", config.color)} />
                            <span className={cn("text-sm font-semibold", config.color)}>{config.label}</span>
                        </div>

                        <div className="space-y-1.5">
                            {criticalAlerts.length > 0 && (
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="w-2 h-2 rounded-full bg-red-500" />
                                    <span className="text-red-400">{criticalAlerts.length} critical alert{criticalAlerts.length > 1 ? "s" : ""}</span>
                                </div>
                            )}
                            {warnings.length > 0 && (
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    <span className="text-amber-400">{warnings.length} warning{warnings.length > 1 ? "s" : ""}</span>
                                </div>
                            )}
                            {criticalAlerts.length === 0 && warnings.length === 0 && (
                                <p className="text-xs text-muted-foreground">No active alerts.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Inline Communication Log */}
            <div className="glass-card p-5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5" /> Communication Log
                </h3>

                {communications.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                        No communication records yet. Agent reports with type "communication" will appear here.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {communications.map((report) => (
                            <div key={report.id} className="flex items-start gap-3 p-3 rounded-lg bg-accent/20 border-l-2"
                                 style={{
                                     borderColor: report.severity === "critical" ? "oklch(0.63 0.24 25)"
                                         : report.severity === "warning" ? "oklch(0.78 0.14 80)"
                                         : "oklch(0.5 0.01 285)",
                                 }}>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground">{report.title}</p>
                                    {report.body && (
                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{report.body}</p>
                                    )}
                                </div>
                                <span className="text-[10px] text-muted-foreground/60 shrink-0">
                                    {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
