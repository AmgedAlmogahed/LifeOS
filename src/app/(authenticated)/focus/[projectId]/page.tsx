import { createClient } from "@/lib/supabase/server";
import { getActiveFocusSession } from "@/lib/actions/focus-sessions";
import { FocusController } from "./focus-controller";
import { notFound } from "next/navigation";

export default async function FocusPage({ params }: { params: { projectId: string } }) {
    const supabase = await createClient();
    const { data: project } = await supabase.from("projects").select("*").eq("id", params.projectId).single();
    
    if (!project) return notFound();

    const activeSession = await getActiveFocusSession(project.id);
    
    // Fetch tasks for this project
    const { data: tasks } = await supabase.from("tasks")
        .select("*")
        .eq("project_id", project.id)
        .neq("status", "Done")
        .order("priority", { ascending: true }); 

    return (
        <div className="container max-w-4xl py-8 px-4">
             <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
                <p className="text-muted-foreground">{project.description}</p>
             </div>
             
             <FocusController 
                project={project}
                initialSession={activeSession}
                tasks={tasks || []}
             />
        </div>
    );
}
