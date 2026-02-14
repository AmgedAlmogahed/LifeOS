import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const result = await supabase.from("quick_captures")
    .select("*", { count: 'exact', head: true })
    .eq("status", "captured");
  const inboxCount = result.count || 0;

  return <AppShell inboxCount={inboxCount}>{children}</AppShell>;
}
