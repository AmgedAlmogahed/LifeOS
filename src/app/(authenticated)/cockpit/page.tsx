import { createClient } from "@/lib/supabase/server";
import { generateRecommendation } from "@/lib/actions/recommendations";
import { Project, Task } from "@/types/database";
import { ArrowRight, Clock, Target, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default async function CockpitPage() {
    const supabase = await createClient();

    // Parallel fetch for dashboard data
    const [
        recommendation,
        projectsResult,
        financialResult,
        personalTasksResult
    ] = await Promise.all([
        generateRecommendation(),
        supabase.from("projects")
            .select("*, focus_sessions(started_at, ended_at)")
            .in("status", ['Document', 'Freeze', 'Implement', 'Verify'])
            .order("updated_at", { ascending: false }),
        supabase.from("invoices")
            .select("amount")
            .in("status", ['Pending', 'Overdue']),
        supabase.from("tasks")
            .select("*")
            .is("project_id", null)
            .neq("status", "Done")
            .order("due_date", { ascending: true })
            .limit(5)
    ]);

    const activeProjects = projectsResult.data || [];
    const outstanding = financialResult.data?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
    const personalTasks = personalTasksResult.data || [];

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

                            <Link href={`/forge/${recommendation.recommendedProject.id}`}
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

            {/* Active Projects Grid */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        Active Projects ({activeProjects.length})
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeProjects.map((project) => (
                        <Link key={project.id} href={`/forge/${project.id}`} className="group block h-full">
                            <div className="h-full bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors flex flex-col">
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{project.name}</h3>
                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider
                                        ${project.status === 'Implement' ? 'bg-amber-500/10 text-amber-500' : 'bg-muted text-muted-foreground'}
                                    `}>
                                        {project.status}
                                    </span>
                                </div>

                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                                    {project.description || "No description provided."}
                                </p>

                                <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Progress: {project.progress}%</span>
                                    {project.updated_at && (
                                        <span>{formatDistanceToNow(new Date(project.updated_at))} ago</span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
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
                         {/* Existing logic might add revenue query here */}
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
        </div>
    );
}

// Ensure dynamic rendering for dashboard
export const dynamic = "force-dynamic";
