import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { validateAgentAuth } from "@/lib/agent-auth";

export async function GET(req: NextRequest) {
    const auth = validateAgentAuth(req);
    if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 });

    const supabase = createAdminClient();

    // 0. Create Test User
    const { data: { users } } = await supabase.auth.admin.listUsers();
    if (!users?.find(u => u.email === "admin@venture.os")) {
        await supabase.auth.admin.createUser({
            email: "admin@venture.os",
            password: "password123",
            email_confirm: true,
        });
    }

    // 1. Clients
    const { data: clients, error: cErr } = await (supabase.from("clients") as any).insert([
        {
            name: "Acme Corp",
            email: "contact@acme.com",
            brand_primary: "#ef4444", // Red
            brand_secondary: "#1e293b",
            health_score: 85,
            is_active: true,
        },
        {
            name: "Globex Inc",
            email: "info@globex.com",
            brand_primary: "#3b82f6", // Blue
            brand_secondary: "#0f172a",
            health_score: 92,
            is_active: true,
        }
    ]).select();

    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

    const acme = clients.find((c: any) => c.name === "Acme Corp");
    const globex = clients.find((c: any) => c.name === "Globex Inc");

    // 2. Opportunities
    const { data: opps, error: oErr } = await (supabase.from("opportunities") as any).insert([
        {
            client_id: acme.id,
            title: "Acme Cloud Migration",
            service_type: "Cloud",
            stage: "Negotiating",
            estimated_value: 45000,
            probability: 75,
        },
        {
            client_id: globex.id,
            title: "Globex Brand Refresh",
            service_type: "Design",
            stage: "Draft",
            estimated_value: 12000,
            probability: 25,
        }
    ]).select();

    if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 });

    const acmeOpp = opps.find((o: any) => o.title === "Acme Cloud Migration");

    // 3. Price Offer
    const { data: offer, error: pErr } = await (supabase.from("price_offers") as any).insert({
        client_id: acme.id,
        opportunity_id: acmeOpp.id,
        title: "Phase 1 Migration Proposal",
        total_value: 45000,
        status: "Sent",
        items: [
            { name: "Infrastructure Audit", service_type: "Cloud", quantity: 1, unit_price: 5000, total: 5000 },
            { name: "Migration Execution", service_type: "Cloud", quantity: 1, unit_price: 40000, total: 40000 }
        ],
        valid_until: new Date(Date.now() + 86400000 * 30).toISOString(),
    }).select().single();

    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

    // 4. Contract (Active)
    await (supabase.from("contracts") as any).insert({
        client_id: globex.id,
        title: "Globex Retainer 2026",
        status: "Active",
        total_value: 5000,
        start_date: new Date().toISOString(),
        terms_md: "# Retainer Agreement\n\nMonthly design support...",
    });

    // 5. Existing Project
    const { data: project } = await (supabase.from("projects") as any).insert({
        name: "Legacy System Review",
        client_id: acme.id,
        status: "Implement",
        progress: 65,
        service_type: "Cloud",
        is_frozen: false,
    }).select().single();

    if (!project) {
        console.error("Failed to seed project");
    } else {
        await (supabase.from("lifecycles") as any).insert({
            project_id: project.id,
            current_stage: "Building",
            stage_history: [{ stage: "Requirements", entered_at: new Date().toISOString() }, { stage: "Building", entered_at: new Date().toISOString() }],
            started_at: new Date().toISOString(),
        });

        await (supabase.from("deployments") as any).insert({
            project_id: project.id,
            client_id: acme.id,
            environment: "Vercel",
            label: "Staging URL",
            url: "https://staging.acme.com",
            status: "healthy",
            last_checked_at: new Date().toISOString(),
        });
    }

    return NextResponse.json({ success: true, message: "Seed completed" });
}
