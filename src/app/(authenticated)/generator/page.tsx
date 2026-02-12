import { createClient } from "@/lib/supabase/server";
import { GeneratorLab } from "./generator-client";

export const dynamic = "force-dynamic";

export default async function GeneratorRoute() {
  const supabase = await createClient();
  const [catalogRes, clientsRes] = await Promise.all([
    supabase.from("service_catalog").select("*").eq("is_active", true).order("service_type"),
    supabase.from("clients").select("id, name"),
  ]);
  return (
    <GeneratorLab
      catalog={(catalogRes.data ?? []) as any[]}
      clients={(clientsRes.data ?? []) as any[]}
    />
  );
}
