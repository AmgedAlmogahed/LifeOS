import { createClient } from "@/lib/supabase/server";
import { InboxClient } from "./inbox-client";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const supabase = await createClient();
  const { data: tasks, error } = await (supabase.from("tasks") as any)
    .select(`*, projects:project_id(id, name)`)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) {
      console.error(error);
      return <div>Error loading inbox</div>;
  }

  return <InboxClient initialTasks={(tasks || []) as any} />;
}
