"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateAccountProfile(id: string, formData: FormData) {
  const supabase = await createClient();

  const updates: Record<string, any> = {};
  const fields = [
    "legal_name", "cr_number", "vat_number", "logo_url", "letterhead_url",
    "primary_color", "bank_name", "bank_iban", "bank_account_name",
    "address_line1", "address_line2", "city", "country",
    "phone", "email", "website",
  ];

  for (const field of fields) {
    const val = formData.get(field);
    if (val !== null) {
      updates[field] = String(val).trim() || null;
    }
  }

  // Boolean field
  const isActive = formData.get("is_active");
  if (isActive !== null) {
    updates.is_active = isActive === "true";
  }

  const { error } = await (supabase.from("accounts" as any) as any)
    .update(updates)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}

export async function getAccounts() {
  const supabase = await createClient();
  const { data, error } = await (supabase.from("accounts" as any) as any)
    .select("*")
    .order("name");

  if (error) return [];
  return data ?? [];
}

export async function createAccount(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  if (!name?.trim()) return { error: "Name is required" };

  const insertData: Record<string, any> = { name: name.trim() };
  const fields = [
    "legal_name", "cr_number", "vat_number", "logo_url", "letterhead_url",
    "primary_color", "bank_name", "bank_iban", "bank_account_name",
    "address_line1", "address_line2", "city", "country",
    "phone", "email", "website",
  ];

  for (const field of fields) {
    const val = formData.get(field);
    if (val !== null) {
      insertData[field] = String(val).trim() || null;
    }
  }

  const isActive = formData.get("is_active");
  if (isActive !== null) insertData.is_active = isActive === "true";

  const { error } = await (supabase.from("accounts" as any) as any).insert(insertData);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}

export async function deleteAccount(id: string) {
  const supabase = await createClient();
  const { error } = await (supabase.from("accounts" as any) as any).delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}
