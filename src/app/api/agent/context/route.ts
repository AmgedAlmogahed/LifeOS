import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("x-agent-key");
    const agentToken = process.env.AGENT_API_KEY;

    if (!agentToken || authHeader !== agentToken) {
        return NextResponse.json({ error: "Unauthorized Agent Access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("project_id");
    const clientId = searchParams.get("client_id");

    if (!projectId && !clientId) {
        return NextResponse.json({ error: "Missing project_id or client_id parameter" }, { status: 400 });
    }

    try {
        const supabase = createAdminClient();
        const responsePayload: any = { documents: [] };

        // Fetch Documents
        let docQuery = supabase.from("documents").select("id, name, category, ai_summary, ai_key_points, summary_generated_at, is_context_active");
        if (projectId) docQuery = docQuery.eq("project_id", projectId);
        else if (clientId) docQuery = docQuery.eq("client_id", clientId);
        
        const { data: documents } = await docQuery.order("created_at", { ascending: false });
        responsePayload.documents = documents || [];

        // Fetch Context Bundle
        let bundleQuery = supabase.from("context_bundles").select("*");
        if (projectId) bundleQuery = bundleQuery.eq("project_id", projectId).eq("bundle_type", "project");
        else bundleQuery = bundleQuery.eq("client_id", clientId).eq("bundle_type", "client");
        
        const { data: bundle } = await bundleQuery.maybeSingle();
        responsePayload.context_bundle = bundle;
        responsePayload.context_text = bundle?.context_text || "";

        // Fetch Specific Entity Context
        if (projectId) {
            const [
                { data: project }, 
                { data: stateContext }, 
                { data: tasks }, 
                { data: sprints }
            ] = await Promise.all([
                supabase.from("projects").select("*").eq("id", projectId).single(),
                supabase.from("project_state_context").select("*").eq("project_id", projectId).maybeSingle(),
                supabase.from("tasks").select("*").eq("project_id", projectId).in("status", ["Todo", "In Progress", "Blocked"]),
                supabase.from("sprints").select("*").eq("project_id", projectId).eq("status", "Active").maybeSingle()
            ]);
            
            responsePayload.entity = project;
            responsePayload.state_context = stateContext;
            responsePayload.tasks = tasks || [];
            responsePayload.sprint = sprints;
        } else if (clientId) {
            const { data: client } = await supabase.from("clients").select("*").eq("id", clientId).single();
            responsePayload.entity = client;
        }

        return NextResponse.json(responsePayload);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
