"use server";

import { createClient } from "@/lib/supabase/server";
import { DailyPlanUpdate } from "@/types/database";
import { revalidatePath } from "next/cache";

export async function getOrCreateDailyPlan(planDate: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data, error } = await (supabase.from("daily_plans") as any).upsert({
        user_id: user.id,
        plan_date: planDate,
        is_completed: false
    }, {
        onConflict: 'user_id,plan_date',
        ignoreDuplicates: false
    }).select().single();

    if (error) throw error;
    return data;
}

export async function updateDailyPlan(planId: string, update: DailyPlanUpdate) {
    const supabase = await createClient();
    const { error } = await supabase.from("daily_plans").update(update).eq("id", planId);
    if (error) throw error;
    revalidatePath("/plan");
}

export async function completeDailyPlan(planId: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("daily_plans").update({
        is_completed: true,
        // checks logic?
    }).eq("id", planId);

    if (error) throw error;
    revalidatePath("/cockpit");
}
