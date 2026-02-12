import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClientDossier } from "./client-dossier";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [clientRes, oppsRes, contractsRes, projectsRes, reportsRes] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).maybeSingle(),
    supabase.from("opportunities").select("*").eq("client_id", id).order("updated_at", { ascending: false }),
    supabase.from("contracts").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("projects").select("*").eq("client_id", id).order("updated_at", { ascending: false }),
    supabase.from("agent_reports").select("*").eq("client_id", id).order("created_at", { ascending: false }).limit(10),
  ]);

  if (!clientRes.data) redirect("/clients");

  return (
    <ClientDossier
      client={clientRes.data as any}
      opportunities={(oppsRes.data ?? []) as any[]}
      contracts={(contractsRes.data ?? []) as any[]}
      projects={(projectsRes.data ?? []) as any[]}
      agentReports={(reportsRes.data ?? []) as any[]}
    />
  );
}
