import { createClient } from "@/lib/supabase/server";
import { generateRecommendation } from "@/lib/actions/recommendations";
import { Project, Task } from "@/types/database";
import { ArrowRight, Bot, Calendar, Clock, LayoutGrid, Target, CheckCircle2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { AgentFeed } from "@/components/features/agents/AgentFeed";
import { CompanyBadge } from "@/components/ui/company-badge";

export default async function CockpitPage() {
    const supabase = await createClient();
    const today = format(new Date(), "yyyy-MM-dd");

    // Parallel fetch for dashboard data
    const [
        recommendation,
        projectsResult,
        financialResult,
        personalTasksResult,
        dailyPlanResult,
        delegationResult,
        projectContextResult,
    ] = await Promise.all([
        generateRecommendation(),
        supabase.from("projects")
            .select(`
              *,
              accounts(name, primary_color),
              focus_sessions(
                session_notes,
                ended_at
              )
            `)
            .in("status", ['Document', 'Freeze', 'Implement', 'Verify', 'Understand'] as any[])
            .order("updated_at", { ascending: false }),
        supabase.from("invoices")
            .select("amount")
            .in("status", ['Pending', 'Overdue']),
        supabase.from("tasks")
            .select("*")
            .is("project_id", null)
            .neq("status", "Done")
            .order("due_date", { ascending: true })
            .limit(5),
        // Today's daily plan with time_blocks
        supabase.from("daily_plans")
            .select("*")
            .eq("plan_date", today)
            .maybeSingle(),
        // Recent delegation activity
        (supabase.from("delegation_log" as any) as any)
            .select("*, tasks(title, project_id)")
            .order("delegated_at", { ascending: false })
            .limit(8),
        // Project state contexts (for cards)
        (supabase.from("project_state_context" as any) as any)
            .select("*")
            .order("updated_at", { ascending: false })
            .limit(6),
    ]);

    const activeProjects = projectsResult.data || [];
    const outstanding = financialResult.data?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
    const personalTasks = personalTasksResult.data || [];
    const dailyPlan = dailyPlanResult.data as any;
    const delegations = (delegationResult.data || []) as any[];
    const projectContexts = (projectContextResult.data || []) as any[];

    // Parse time_blocks from daily plan
    const timeBlocks: { start: string; end: string; label: string; color?: string }[] = (() => {
        if (!dailyPlan?.time_blocks) return [];
        try {
            const blocks = typeof dailyPlan.time_blocks === "string"
                ? JSON.parse(dailyPlan.time_blocks) : dailyPlan.time_blocks;
            return Array.isArray(blocks) ? blocks : [];
        } catch { return []; }
    })();

    // Map project contexts to project names
    const projectMap = new Map(activeProjects.map(p => [p.id, p.name]));

    return (
        <div className="container mx-auto max-w-5xl py-8 space-y-8 px-4">

            {/* AI Recommendation */}
            <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-primary/20 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Target className="w-32 h-32" />
                </div>

                <h2 className="text-sm font-semibold uppercase tracking-wider text-primary mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" /> AI Recommendation
                </h2>

                <div className="relative z-10">
                    {recommendation.recommendedProject ? (
                        <div>
                            <h3 className="text-2xl font-bold mb-1">{recommendation.recommendedProject.name}</h3>
                            <p className="text-muted-foreground mb-4 max-w-lg">{recommendation.reason}</p>

                            <Link href={`/projects/${recommendation.recommendedProject.id}`}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                            >
                                View Project <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No active projects to focus on right now.</p>
                    )}
                </div>
            </div>

            {/* Daily Plan Time Blocks */}
            {timeBlocks.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Today&apos;s Time Blocks
                        </h2>
                        <Link href="/plan" className="text-xs text-primary hover:underline">Edit Plan</Link>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {timeBlocks.map((block, i) => (
                            <div key={i} className="flex-shrink-0 rounded-lg border border-border bg-muted/20 px-4 py-3 min-w-[140px]"
                                 style={{ borderLeftColor: block.color || "hsl(var(--primary))", borderLeftWidth: "3px" }}>
                                <div className="text-[10px] font-mono text-muted-foreground">{block.start} – {block.end}</div>
                                <div className="text-sm font-medium text-foreground mt-0.5 truncate">{block.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Active Projects Grid */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        Active Projects ({activeProjects.length})
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeProjects.map((project) => {
                        const ctx = projectContexts.find((c: any) => c.project_id === project.id);
                        return (
                        <Link key={project.id} href={`/projects/${project.id}`} className="group block h-full">
                            <div className="h-full bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors flex flex-col">
                                <div className="flex items-start justify-between mb-3 min-h-[3rem]">
                                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">{project.name}</h3>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider
                                            ${project.status === 'Implement' ? 'bg-amber-500/10 text-amber-500' : 'bg-muted text-muted-foreground'}
                                        `}>
                                            {project.status}
                                        </span>
                                        <CompanyBadge account={project.accounts} size="sm" />
                                    </div>
                                </div>

                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                                    {project.description || "No description provided."}
                                </p>

                                {/* Project State Context card */}
                                {ctx && ctx.next_action && (
                                    <div className="flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/10 text-primary mb-2">
                                        <LayoutGrid className="w-3 h-3 mt-0.5 shrink-0" />
                                        <span className="text-[10px] font-medium line-clamp-1 leading-relaxed">
                                            Next: {ctx.next_action}
                                        </span>
                                    </div>
                                )}

                                {/* Resume Snippet: show most recent session note */}
                                {(() => {
                                  const sessions = (project as any).focus_sessions;
                                  if (!sessions || sessions.length === 0) return null;
                                  const sorted = [...sessions].sort((a: any, b: any) =>
                                    new Date(b.ended_at || 0).getTime() - new Date(a.ended_at || 0).getTime()
                                  );
                                  const note = sorted[0]?.session_notes;
                                  if (!note) return null;
                                  return (
                                    <div className="flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-3">
                                      <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                                      <span className="text-[10px] font-medium line-clamp-2 leading-relaxed">{note}</span>
                                    </div>
                                  );
                                })()}

                                <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Progress: {project.progress}%</span>
                                    {project.updated_at && (
                                        <span>{formatDistanceToNow(new Date(project.updated_at))} ago</span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    )})}
                    {activeProjects.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                            No active projects found.
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Financial Snapshot */}
                <div className="bg-card border border-border rounded-xl p-6">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Financial Snapshot</h2>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                             <div className="text-3xl font-bold text-foreground">
                                 ${outstanding.toLocaleString()}
                             </div>
                             <div className="text-xs text-muted-foreground mt-1">Outstanding Invoices</div>
                         </div>
                    </div>
                </div>

                {/* Personal Tasks Queue */}
                <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                         <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Personal Tasks</h2>
                         <Link href="/inbox" className="text-xs text-primary hover:underline">View All</Link>
                    </div>

                    <div className="space-y-3">
                        {personalTasks.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No personal tasks pending.</p>
                        ) : (
                            personalTasks.map(task => (
                                <div key={task.id} className="flex items-start gap-3 group">
                                    <div className="mt-0.5 w-4 h-4 rounded-full border border-muted-foreground/30 group-hover:border-primary transition-colors" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">{task.title}</div>
                                        {task.due_date && (
                                            <div className="text-[10px] text-muted-foreground">
                                                Due {new Date(task.due_date).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Agent Activity Feed */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Bot className="w-4 h-4" /> Agent Activity
                    </h2>
                    <Link href="/agents" className="text-xs text-primary hover:underline">Agents →</Link>
                </div>
                <AgentFeed limit={8} initialData={delegations} />
            </div>
        </div>
    );
}

// Ensure dynamic rendering for dashboard
export const dynamic = "force-dynamic";
