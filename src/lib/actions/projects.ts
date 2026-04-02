"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createProject(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get("name") as string;
    if (!name?.trim()) return { error: "Name is required" };

    const budgetStr = formData.get("budget") as string;
    const category = formData.get("category") as string || "Personal";
    
    const { data: rpcData, error: rpcError } = await supabase.rpc("create_project_with_framework", {
        p_name: name.trim(),
        p_category: category,
        p_client_id: formData.get("client_id") as string || null,
        p_account_id: formData.get("account_id") as string || null,
        p_contract_id: formData.get("contract_id") as string || null,
        p_tracker_id: null
    });

    if (rpcError) return { error: rpcError.message };

    const projectId = (rpcData as any)?.project_id;
    
    if (projectId) {
        // Update additionally provided fields like budget, desc, specs
        const budgetStr = formData.get("budget") as string;
        await (supabase.from("projects") as any).update({
            description: (formData.get("description") as string) ?? "",
            specs_md: (formData.get("specs_md") as string) ?? "",
            budget: budgetStr ? Number(budgetStr) : 0,
            service_type: formData.get("service_type") as string || null,
        }).eq("id", projectId);
    }

    revalidatePath("/projects");
    revalidatePath("/dashboard");
    return { success: true, id: projectId };
}

export async function updateProject(id: string, formData: FormData) {
    const supabase = await createClient();
    const fields: Record<string, unknown> = {};
    for (const [key, val] of formData.entries()) {
        if (val !== "") {
            if (key === "progress") fields[key] = Number(val);
            else if (key === "is_frozen") fields[key] = val === "true";
            else fields[key] = val;
        }
    }
    const { error } = await (supabase.from("projects") as any).update(fields).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    revalidatePath("/dashboard");
    return { success: true };
}

export async function deleteProject(id: string) {
    const supabase = await createClient();
    const { error } = await (supabase.from("projects") as any).delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/projects");
    revalidatePath("/dashboard");
    return { success: true };
}

/** Update only the lifecycle status of a project */
export async function updateProjectStatus(id: string, status: string) {
    const supabase = await createClient();
    const { error } = await (supabase.from("projects") as any).update({ status }).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    return { success: true };
}
/** Find projects where total expenses exceed the defined budget */
export async function getBudgetOverruns() {
    const supabase = await createClient();
    
    // Fetch all projects with budgets
    const { data: projects } = await (supabase.from("projects") as any).select("id, name, budget").gt("budget", 0);
    
    if (!projects) return [];

    const overruns = [];
    for (const p of projects) {
        const { data: expenses } = await (supabase.from("expenses") as any).select("amount").eq("project_id", p.id);
        const total = (expenses || []).reduce((acc: number, e: any) => acc + Number(e.amount), 0);
        
        if (total > p.budget) {
            overruns.push({
                id: p.id,
                name: p.name,
                budget: p.budget,
                total_spent: total,
                overage: total - p.budget
            });
        }
    }
    
    return overruns;
}
