"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface AuthorityApplication {
    id: string;
    project_id: string;
    authority_name: string;
    permit_type: string;
    tracking_id: string | null;
    submission_date: string | null;
    status: "not_submitted" | "submitted" | "under_review" | "approved" | "rejected" | "requires_resubmission";
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export async function getAuthorityApplications(projectId: string): Promise<AuthorityApplication[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("authority_applications" as any)
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
    if (error) return [];
    return (data as unknown as AuthorityApplication[]) ?? [];
}

export async function createAuthorityApplication(
    projectId: string,
    data: {
        authority_name: string;
        permit_type: string;
        tracking_id?: string;
        submission_date?: string;
        notes?: string;
    }
) {
    const supabase = await createClient();
    const { error } = await supabase.from("authority_applications" as any).insert({
        project_id: projectId,
        ...data,
        status: data.submission_date ? "submitted" : "not_submitted",
    });
    if (error) return { error: error.message };
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function updateAuthorityApplication(
    id: string,
    projectId: string,
    data: Partial<AuthorityApplication>
) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("authority_applications" as any)
        .update(data)
        .eq("id", id);
    if (error) return { error: error.message };
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function deleteAuthorityApplication(id: string, projectId: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("authority_applications" as any).delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}
