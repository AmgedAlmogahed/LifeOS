import { createClient } from "@/lib/supabase/server";
import { getUnprocessedCaptures } from "@/lib/actions/captures";
import { InboxClient } from "./inbox-client";

export default async function InboxPage() {
    const supabase = await createClient();
    
    // Fetch captures
    const captures = await getUnprocessedCaptures();
    
    // Fetch unplanned tasks
    const { data: unplannedTasks } = await supabase.from("tasks")
        .select("*")
        .is("project_id", null)
        .neq("status", "Done")
        .order("created_at", { ascending: false });

    // Fetch active projects for dropdown in client
    const { data: projects } = await supabase.from("projects")
         .select("id, name")
         .in("status", ['Document', 'Freeze', 'Implement', 'Verify']);

    return (
        <InboxClient 
            initialCaptures={captures || []} 
            initialTasks={unplannedTasks || []}
            projects={projects || []}
        />
    );
}
