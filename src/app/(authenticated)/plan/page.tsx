import { getOrCreateDailyPlan } from "@/lib/actions/daily-plans";
import { generateRecommendation } from "@/lib/actions/recommendations";
import { getUnprocessedCaptures } from "@/lib/actions/captures";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { PlanEditor } from "./plan-editor";

export default async function PlanPage() {
    const today = format(new Date(), "yyyy-MM-dd");
    const supabase = await createClient();

    // Parallel data fetching
    const [
        plan,
        recommendationResult,
        captures,
        projectsResult,
        statsResult
    ] = await Promise.all([
        getOrCreateDailyPlan(today),
        generateRecommendation(),
        getUnprocessedCaptures(),
        // Projects with non-done tasks
        supabase.from("projects")
            .select("*, tasks(id, title, status, committed_date)")
            .eq("status", "Implement") // Logic says active projects... recommendations uses ['Document', 'Freeze', 'Implement', 'Verify']
            .in("status", ['Document', 'Freeze', 'Implement', 'Verify'])
            .order("updated_at", { ascending: false }),
        
        // Stats: implementation logic needs raw queries or separate fetches
        // Let's do a simple meaningful fetch here
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { completed: 0, inProgress: 0, focusMinutes: 0 };
            
            // Completed today (completed_at starts with today)
            // Or better: completed_at >= today start
            const todayStart = new Date();
            todayStart.setHours(0,0,0,0);
            
            const { count: completed } = await supabase.from("tasks")
                .select("*", { count: 'exact', head: true })
                .eq("status", "Done")
                .gte("completed_at", todayStart.toISOString());
            
            const { count: inProgress } = await supabase.from("tasks")
                .select("*", { count: 'exact', head: true })
                .eq("status", "In Progress");

            // Focus time
             const { data: sessions } = await supabase.from("focus_sessions")
                .select("started_at, ended_at")
                .gte("started_at", todayStart.toISOString())
                .not("ended_at", "is", null);
            
            const focusMinutes = sessions?.reduce((acc, sess) => {
                const dur = (new Date(sess.ended_at!).getTime() - new Date(sess.started_at).getTime()) / 1000 / 60;
                return acc + dur;
            }, 0) || 0;

            return { completed: completed || 0, inProgress: inProgress || 0, focusMinutes: Math.round(focusMinutes) };
        })()
    ]);

    // Process projects to filter tasks? The select already pulls tasks.
    // Supabase returns tasks as array on project.
    // We need to filter out Done tasks if the query didn't (it didn't).
    const projects = projectsResult.data?.map(p => ({
        ...p,
        tasks: Array.isArray(p.tasks) ? p.tasks.filter((t: any) => t.status !== 'Done') : []
    })) || [];

    return (
        <div className="container max-w-3xl py-8 px-4">
             <h1 className="text-2xl font-bold mb-2">Evening Plan</h1>
             <p className="text-muted-foreground mb-8">Reflect on today, prepare for tomorrow.</p>
             <PlanEditor 
                initialPlan={plan} 
                recommendation={recommendationResult}
                captures={captures}
                projects={projects as any}
                stats={statsResult}
             />
        </div>
    );
}
