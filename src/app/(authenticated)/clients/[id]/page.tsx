import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClientDossier } from "./client-dossier";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [clientRes, oppsRes, contractsRes, projectsRes, reportsRes, invsRes, commRes, docsRes, bundleRes] = await Promise.all([
    supabase.from("clients").select("*, accounts(name, primary_color)").eq("id", id).maybeSingle(),
    supabase.from("opportunities").select("*").eq("client_id", id).order("updated_at", { ascending: false }),
    supabase.from("contracts").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("projects").select("*").eq("client_id", id).order("updated_at", { ascending: false }),
    supabase.from("agent_reports").select("*").eq("client_id", id).order("created_at", { ascending: false }).limit(10),
    supabase.from("invoices").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("communication_logs" as any).select("*").eq("client_id", id).order("logged_at", { ascending: false }),
    supabase.from("documents" as any).select("*").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("context_bundles" as any).select("*").eq("client_id", id).eq("bundle_type", "client").maybeSingle(),
  ]);

  if (!clientRes.data) redirect("/clients");

  return (
    <ClientDossier
      client={clientRes.data as any}
      opportunities={(oppsRes.data ?? []) as any[]}
      contracts={(contractsRes.data ?? []) as any[]}
      projects={(projectsRes.data ?? []) as any[]}
      agentReports={(reportsRes.data ?? []) as any[]}
      invoices={(invsRes.data ?? []) as any[]}
      communicationLogs={(commRes.data ?? []) as any[]}
      documents={(docsRes.data ?? []) as any[]}
      contextBundle={bundleRes.data as any}
    />
  );
}
