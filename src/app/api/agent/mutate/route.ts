import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    const agentToken = process.env.AGENT_API_KEY;

    if (!agentToken || authHeader !== `Bearer ${agentToken}`) {
        return NextResponse.json({ error: "Unauthorized Agent Access" }, { status: 401 });
    }

    try {
        const payload = await req.json();
        const { action, id, data } = payload;

        if (!action || !id || !data) {
            return NextResponse.json({ error: "Invalid payload format. Expected {action, id, data}" }, { status: 400 });
        }

        // Handle orchestration assignments and updates
        switch (action) {
            case "CompleteTask":
                const { error: taskErr } = await supabase
                    .from("tasks")
                    .update({ status: "Done", ...data })
                    .eq("id", id);
                if (taskErr) throw taskErr;
                
                // Also update the delegation log
                await supabase
                    .from("delegation_log")
                    .update({ status: "completed", completed_at: new Date().toISOString(), result_summary: data.result_summary })
                    .eq("task_id", id);
                break;

            case "UpdateProjectContext":
                const { error: ctxErr } = await supabase
                    .from("project_state_context")
                    .update({ ...data, updated_at: new Date().toISOString() })
                    .eq("project_id", id);
                if (ctxErr) throw ctxErr;
                break;

            case "LogInteraction":
                const { error: logErr } = await supabase
                    .from("communication_logs")
                    .insert({ client_id: id, ...data });
                if (logErr) throw logErr;
                break;

            case "rpc": {
                // For RPCs, 'id' can be the function_name, and 'data' contains the arguments
                // Or 'data.function_name' contains it.
                const functionName = data.function_name || id;
                const rpcArgs = data.args || data;
                
                const { data: rpcRes, error: rpErr } = await supabase.rpc(functionName, rpcArgs);
                if (rpErr) throw rpErr;
                return NextResponse.json({ success: true, message: `RPC ${functionName} executed.`, result: rpcRes });
            }

            default:
                return NextResponse.json({ error: `Unknown mutation action: ${action}` }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: `Action ${action} executed.` });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
