import { createClient } from "@/lib/supabase/server";
import { PipelineBoard } from "./pipeline-client";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const supabase = await createClient();
  const [oppsRes, clientsRes] = await Promise.all([
    supabase.from("opportunities").select("*").order("updated_at", { ascending: false }),
    supabase.from("clients").select("id, name").order("name"),
  ]);
  return (
    <PipelineBoard
      opportunities={(oppsRes.data ?? []) as any[]}
      clients={(clientsRes.data ?? []) as any[]}
    />
  );
}
