import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugProjects() {
  console.log("--- Projects in DB ---");
  const { data: projects, error: pError } = await supabase.from("projects").select("id, name, account_id, client_id, status");
  if (pError) console.error("Error fetching projects:", pError.message);
  else console.log(`Found ${projects.length} projects:`, projects);

  console.log("\n--- Accounts in DB ---");
  const { data: accounts, error: aError } = await supabase.from("accounts").select("id, name");
  if (aError) console.error("Error fetching accounts:", aError.message);
  else console.log(`Found ${accounts.length} accounts:`, accounts);

  console.log("\n--- Clients in DB ---");
  const { data: clients, error: cError } = await supabase.from("clients").select("id, name");
  if (cError) console.error("Error fetching clients:", cError.message);
  else console.log(`Found ${clients.length} clients:`, clients);

  console.log("\n--- Joined Query Verification ---");
  const { data: joined, error: jError } = await supabase
    .from("projects")
    .select("*, clients(name), accounts(name, primary_color)");
  if (jError) console.error("Error in joined query:", jError.message);
  else console.log(`Joined query returned ${joined ? joined.length : 0} results.`);
}

debugProjects();
