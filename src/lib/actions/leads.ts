"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createLead(formData: FormData) {
  const supabase = await createClient();

  const account_id = formData.get("account_id") as string;
  const channel = formData.get("channel") as string;
  const contact_name = formData.get("contact_name") as string;
  const mobile = (formData.get("mobile") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim() || null;

  if (!account_id || !channel || !contact_name) {
    return { error: "Company, channel, and contact name are required." };
  }

  if (!mobile && !email) {
    return { error: "At least one of mobile or email is required." };
  }

  // Build channel_metadata from channel-specific fields
  const channelMetadata: Record<string, any> = {};
  if (channel === "CH-REF") {
    channelMetadata.referral_name = formData.get("referral_name") || null;
    channelMetadata.relationship = formData.get("relationship") || null;
  } else if (channel === "CH-SOC") {
    channelMetadata.platform = formData.get("platform") || null;
    channelMetadata.post_link = formData.get("post_link") || null;
  } else if (channel === "CH-WEB") {
    channelMetadata.page_url = formData.get("page_url") || null;
  } else if (channel === "CH-OUT") {
    channelMetadata.outreach_method = formData.get("outreach_method") || null;
    channelMetadata.context = formData.get("outreach_context") || null;
  }

  const servicesRaw = formData.get("services_requested") as string;
  const services_requested = servicesRaw ? servicesRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const { data: lead, error } = await (supabase.from("leads" as any) as any).insert({
    account_id,
    channel,
    contact_name,
    mobile,
    email,
    region: (formData.get("region") as string)?.trim() || null,
    services_requested,
    notes: (formData.get("notes") as string)?.trim() || "",
    priority: (formData.get("priority") as string) || "Normal",
    source_detail: (formData.get("source_detail") as string)?.trim() || "",
    estimated_value: parseFloat((formData.get("estimated_value") as string) || "0") || 0,
    channel_metadata: channelMetadata,
    status: "INCOMING",
  }).select().single();

  if (error) return { error: error.message };

  if (lead) {
      // Create pipeline tracker
      await (supabase.from("pipeline_tracker") as any).insert({
          account_id: account_id,
          lead_id: lead.id,
          current_stage: "lead_new"
      });
  }

  revalidatePath("/leads");
  revalidatePath("/cockpit");
  return { success: true };
}

export async function updateLeadStatus(
  id: string,
  status: string,
  reason?: string
) {
  const supabase = await createClient();

  const updates: Record<string, any> = { status, updated_at: new Date().toISOString() };
  if (status === "DISQUALIFIED" && reason) {
    updates.disqualify_reason = reason;
  }

  const { error } = await (supabase.from("leads" as any) as any)
    .update(updates)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/leads");
  return { success: true };
}

export async function convertLead(id: string) {
  const supabase = await createClient();

  // 1. Get the lead
  const { data: lead, error: fetchErr } = await (supabase.from("leads" as any) as any)
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !lead) return { error: "Lead not found." };

  // 2. Create client from lead
  const { data: client, error: clientErr } = await supabase.from("clients").insert({
    name: lead.contact_name,
    email: lead.email,
    phone: lead.mobile,
    account_id: lead.account_id,
    health_score: 100,
    is_active: true,
  } as any).select("id").single();

  if (clientErr) return { error: `Failed to create client: ${clientErr.message}` };

  // 3. Create opportunity from lead
  const { data: opp, error: oppErr } = await supabase.from("opportunities").insert({
    client_id: client.id,
    title: `${lead.contact_name} — initial opportunity`,
    estimated_value: lead.estimated_value || 0,
    probability: 50,
    stage: "Draft",
    service_type: "Web",
    description: lead.notes || "",
  } as any).select("id").single();

  if (oppErr) return { error: `Failed to create opportunity: ${oppErr.message}` };

  // 4. Update lead as converted
  await (supabase.from("leads" as any) as any)
    .update({
      status: "CONVERTED",
      converted_client_id: client.id,
      converted_opportunity_id: opp.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
    
  // 5. Advance Pipeline Tracker
  const { data: tracker } = await (supabase.from("pipeline_tracker") as any)
    .select("id")
    .eq("lead_id", id)
    .single();

  if (tracker) {
    await supabase.rpc('advance_pipeline', {
      p_tracker_id: tracker.id,
      p_new_stage: 'opportunity_created'
    });
    // Link client and opp
    await (supabase.from("pipeline_tracker") as any)
      .update({ client_id: client.id, opportunity_id: opp.id })
      .eq("id", tracker.id);
  } else {
    // If for some reason legacy lead didn't have one, create it now
    await (supabase.from("pipeline_tracker") as any).insert({
      account_id: lead.account_id,
      lead_id: lead.id,
      client_id: client.id,
      opportunity_id: opp.id,
      current_stage: "opportunity_created"
    });
  }

  revalidatePath("/leads");
  revalidatePath("/clients");
  revalidatePath("/pipeline");
  return { success: true, clientId: client.id, opportunityId: opp.id };
}
