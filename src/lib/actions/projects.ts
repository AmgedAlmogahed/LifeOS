"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createProject(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get("name") as string;
    if (!name?.trim()) return { error: "Name is required" };

    const budgetStr = formData.get("budget") as string;
    const category = formData.get("category") as string || "Personal";

    const { data: project, error } = await (supabase.from("projects") as any).insert({
        name: name.trim(),
        description: (formData.get("description") as string) ?? "",
        status: "Understand",
        progress: 0,
        is_frozen: false,
        specs_md: (formData.get("specs_md") as string) ?? "",
        client_id: formData.get("client_id") as string || null,
        account_id: formData.get("account_id") as string || null,
        budget: budgetStr ? Number(budgetStr) : 0,
        contract_id: formData.get("contract_id") as string || null,
        service_type: formData.get("service_type") as string || null,
    }).select().single();

    if (error) return { error: error.message };

    if (project) {
        // Fetch matching template from DB
        const { data: template } = await (supabase.from("project_templates") as any).select("*").eq("category", category).single();

        if (!template || !template.phases || template.phases.length === 0) {
            // Fallback to legacy static insert if no framework matches
            await (supabase.from("lifecycles") as any).insert({
                project_id: project.id,
                current_stage: "Requirements",
                stage_history: [{ stage: "Requirements", entered_at: new Date().toISOString() }],
                started_at: new Date().toISOString(),
            });
        } else {
            // Apply the Project Framework Lifecycle
            const phasesInfo = template.phases.map((p: any) => ({
                name: p.name,
                order: p.order,
                entered_at: null,
                completed_at: null,
            }));
            
            phasesInfo[0].entered_at = new Date().toISOString();

            await (supabase.from("lifecycles") as any).insert({
                project_id: project.id,
                current_stage: phasesInfo[0].name,
                stage_history: phasesInfo,
                started_at: new Date().toISOString(),
            });

            // Generate Tasks across all phases
            const tasksToInsert: any[] = [];
            
            template.phases.forEach((phase: any, index: number) => {
                const isPhase1 = index === 0;
                
                phase.tasks.forEach((taskTpl: any) => {
                    tasksToInsert.push({
                        project_id: project.id,
                        title: taskTpl.title,
                        type: taskTpl.type,
                        priority: taskTpl.priority,
                        energy_level: taskTpl.energy_level,
                        estimated_minutes: taskTpl.estimated_minutes,
                        status: 'Todo',
                        metadata: isPhase1 ? 
                            { from_template: true, phase: phase.name } : 
                            { from_template: true, phase: phase.name, backlog: true },
                    });
                });
            });

            if (tasksToInsert.length > 0) {
                const { error: batchErr } = await (supabase.from("tasks") as any).insert(tasksToInsert);
                if (batchErr) console.error("Could not batch insert templated tasks:", batchErr.message);
            }
        }
    }

    revalidatePath("/projects");
    revalidatePath("/dashboard");
    return { success: true, id: project?.id };
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
