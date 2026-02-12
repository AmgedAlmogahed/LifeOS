import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let inboxCount = 0;
  if (user) {
      const result = await supabase.from("quick_captures")
        .select("*", { count: 'exact', head: true })
        .eq("status", "captured")
        .eq("user_id", user.id);
      inboxCount = result.count || 0;
  }

  return <AppShell inboxCount={inboxCount}>{children}</AppShell>;
}
