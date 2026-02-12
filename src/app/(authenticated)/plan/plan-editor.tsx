"use client";

import { useState } from "react";
import { DailyPlan } from "@/types/database";
import { updateDailyPlan, completeDailyPlan } from "@/lib/actions/daily-plans";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, Loader2, Save } from "lucide-react";

interface PlanEditorProps {
    initialPlan: DailyPlan;
}

export function PlanEditor({ initialPlan }: PlanEditorProps) {
    const [plan, setPlan] = useState(initialPlan);
    const [reflection, setReflection] = useState(plan.reflection_notes || "");
    const [planNotes, setPlanNotes] = useState(plan.plan_notes || "");
    const [isSaving, setIsSaving] = useState(false);

    async function handleSave() {
        setIsSaving(true);
        try {
            await updateDailyPlan(plan.id, {
                reflection_notes: reflection,
                plan_notes: planNotes
            });
            toast.success("Saved", { description: "Your plan is updated." });
        } catch (error) {
            toast.error("Error", { description: "Failed to save." });
        } finally {
            setIsSaving(false);
        }
    }

    async function handleComplete() {
        await handleSave();
        try {
            await completeDailyPlan(plan.id);
            toast.success("Completed", { description: "Good night!" });
            // Redirect or show success state?
        } catch (error) {
           // ...
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    1. Reflection on Today
                </h2>
                <p className="text-sm text-muted-foreground">What went well? What didn't? Any lessons?</p>
                <Textarea 
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="Today was..."
                    className="min-h-[150px] resize-none text-base"
                />
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    2. Plan for Tomorrow
                </h2>
                <p className="text-sm text-muted-foreground">Top 3 priorities? Key meetings?</p>
                <Textarea 
                    value={planNotes}
                    onChange={(e) => setPlanNotes(e.target.value)}
                    placeholder="Tomorrows focus..."
                    className="min-h-[150px] resize-none text-base"
                />
            </section>
            
            {plan.ai_recommendation_text && (
                 <section className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                     <h3 className="font-semibold text-primary mb-2">AI Suggestion</h3>
                     <p className="text-sm text-muted-foreground">{plan.ai_recommendation_text}</p>
                 </section>
            )}

            <div className="flex justify-end gap-4 pt-8 border-t">
                <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Draft
                </Button>
                <Button onClick={handleComplete} disabled={isSaving || (plan.is_completed ?? false)}>
                    <Check className="w-4 h-4 mr-2" />
                    {plan.is_completed ? "Completed" : "Complete & Close Day"}
                </Button>
            </div>
        </div>
    );
}
