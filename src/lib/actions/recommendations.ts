"use server";

import { createClient } from "@/lib/supabase/server";
import { Project } from "@/types/database";

export async function generateRecommendation(): Promise<{
    recommendedProject: Project | null;
    reason: string;
}> {
    const supabase = await createClient();

    // Fetch active projects
    const { data: projects, error } = await supabase.from("projects")
        .select("*")
        .in("status", ['Document', 'Freeze', 'Implement', 'Verify'])
        .order("updated_at", { ascending: false })
        .limit(5);

    if (error || !projects || projects.length === 0) {
        return { recommendedProject: null, reason: "No active projects found." };
    }

    // TODO: Implement full scoring algorithm based on tasks deadlines and focus sessions
    // For now, return the most recently updated active project.

    return {
        recommendedProject: projects[0],
        reason: "Recently active project requires your focus."
    };
}
