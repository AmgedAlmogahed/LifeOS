import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./dashboard-client";
import { redirect } from "next/navigation";

export const metadata = { title: "Company Dashboard | Venture OS" };

export default async function CrossCompanyDashboardPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/auth/login");

  // Fetch all cross-company data to visualize aggregated metrics.
  // Using generic tables for the UI. If migrations are missing, we gracefully mock.
  const { data: accounts } = await supabase.from("accounts").select("*").eq("is_active", true);
  
  let metricsData = {
      projectsAll: 0,
      activeClients: 0,
      pipelineTotal: 0,
      revenueTotal: 0
  };

  try {
      const { data: projects } = await supabase.from("projects").select("id", { count: "exact" });
      const { data: clients } = await supabase.from("clients").select("id", { count: "exact" });
      const { data: opps } = await supabase.from("opportunities").select("estimated_value").neq("stage", "Lost");
      const { data: invoices } = await supabase.from("invoices").select("amount").eq("status", "Paid");

      metricsData = {
          projectsAll: projects?.length || 0,
          activeClients: clients?.length || 0,
          pipelineTotal: opps?.reduce((s, o) => s + (o.estimated_value || 0), 0) || 0,
          revenueTotal: invoices?.reduce((s, o) => s + (o.amount || 0), 0) || 0
      };
  } catch (err) {
      console.warn("Could not fetch fully aggregated dash metrics, fallback to zeros:", err);
  }

  return <DashboardClient accounts={accounts || []} globalMetrics={metricsData} />;
}
