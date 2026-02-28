const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read env vars
const envFile = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data: sprint, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('project_id', '35cc6739-6199-41ef-9bb6-335e2639814f')
        .eq('status', 'active')
        .maybeSingle();

    console.log("Service Role Query:", { sprint, error });
}

test();
