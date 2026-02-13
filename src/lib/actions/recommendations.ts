"use server";

import { createClient } from "@/lib/supabase/server";
import { Project } from "@/types/database";

export async function generateRecommendation(): Promise<{
    recommendedProject: Project | null;
    reason: string;
}> {
    const supabase = await createClient();

    const { data: projects, error } = await supabase.from("projects")
        .select(`
            *,
            contracts (
                end_date
            )
        `)
        .in("status", ['Document', 'Freeze', 'Implement', 'Verify'])
        .order("updated_at", { ascending: false })
        .limit(10);

    if (error || !projects || projects.length === 0) {
        return { recommendedProject: null, reason: "No active projects found." };
    }

    const projectIds = projects.map(p => p.id);

    // Fetch related data in parallel
    const [
        { data: tasks },
        { data: sessions },
        { data: sprints }
    ] = await Promise.all([
        supabase.from("tasks")
            .select("id, project_id, status, due_date")
            .in("project_id", projectIds)
            .neq("status", "Done"),
        supabase.from("focus_sessions")
            .select("project_id, started_at")
            .in("project_id", projectIds)
            .order("started_at", { ascending: false }),
        supabase.from("sprints")
            .select("id, project_id, status, planned_end_at, created_at")
            .in("project_id", projectIds)
            .eq("status", "active")
    ]);

    const scores = projects.map(project => {
        let score = 0;
        let reasons: string[] = [];

        // Cast to any to handle joined data types not in strict Project definition
        const p = project as any;

        // Determine effective deadline: Active Sprint End > Contract End
        const activeSprint = sprints?.find(s => s.project_id === project.id);
        const contractEnd = Array.isArray(p.contracts) && p.contracts.length > 0
            ? p.contracts[0].end_date
            : p.contracts?.end_date;
        const effectiveDeadline = activeSprint?.planned_end_at || contractEnd;

        // 1. Deadline (40% / 30%)
        let deadlineScore = 0;
        if (effectiveDeadline) {
            const daysUntil = Math.ceil((new Date(effectiveDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            if (daysUntil <= 0) deadlineScore = 100; // Overdue!
            else if (daysUntil <= 3) deadlineScore = 90;
            else if (daysUntil <= 7) deadlineScore = 70;
            else if (daysUntil <= 14) deadlineScore = 40;
            else deadlineScore = 10;

            if (daysUntil <= 7) reasons.push(`Deadline in ${daysUntil} days`);
        }

        // 2. Overdue Tasks (20% / 15%)
        const projectTasks = tasks?.filter(t => t.project_id === project.id) || [];
        const overdueCount = projectTasks.filter(t => t.due_date && new Date(t.due_date) < new Date()).length;
        const overdueScore = Math.min(overdueCount * 10, 100); // Cap at 10 tasks
        if (overdueCount > 0) reasons.push(`${overdueCount} overdue tasks`);

        // 3. Days Since Last Session (20% / 15%)
        const lastSession = sessions?.find(s => s.project_id === project.id);
        let sessionScore = 0;
        if (lastSession) {
            const daysSince = Math.ceil((Date.now() - new Date(lastSession.started_at).getTime()) / (1000 * 60 * 60 * 24));
            sessionScore = Math.min(daysSince * 10, 100); // 10 points per day neglected
            if (daysSince > 3) reasons.push(`Neglected for ${daysSince} days`);
        } else {
            sessionScore = 100; // Never touched
            reasons.push("Never started");
        }

        // 4. Blocked Tasks (10% / 10%)
        const blockedCount = projectTasks.filter(t => t.status === 'Blocked').length;
        const blockedScore = Math.min(blockedCount * 20, 100);
        if (blockedCount > 0) reasons.push(`${blockedCount} blocked tasks`);

        if (activeSprint) {
            // SPRINT WEIGHTS
            // Deadline: 30%, Progress: 25%, Overdue: 15%, Session: 15%, Blocked: 10%

            // Sprint Progress vs Time
            // We can't easily calculate accurate task completion % without fetching ALL sprint tasks (done included).
            // For now, let's assume existence of active sprint boosts score significantly
            const sprintScore = 80; // Arbitrary high base for active sprint
            reasons.push("Active Sprint in progress");

            score = (deadlineScore * 0.3) + (sprintScore * 0.25) + (overdueScore * 0.15) + (sessionScore * 0.15) + (blockedScore * 0.10);
        } else {
            // STANDARD WEIGHTS
            // Deadline: 40%, Overdue: 20%, Session: 20%, Blocked: 10%
            score = (deadlineScore * 0.4) + (overdueScore * 0.2) + (sessionScore * 0.2) + (blockedScore * 0.1);
        }

        console.log(`[AI Recommendation] Project: ${project.name}, Score: ${score.toFixed(2)}, Reasons: ${reasons.join(", ")}`);

        return { project, score, reason: reasons.join(", ") || "General maintenance" };
    });

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    const winner = scores[0];

    if (!winner || winner.score === 0) {
        // Fallback to most recent
        return {
            recommendedProject: projects[0],
            reason: "Most recently active project."
        };
    }

    return {
        recommendedProject: winner.project,
        reason: winner.reason
    };
}
