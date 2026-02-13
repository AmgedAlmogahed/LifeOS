"use client";

import { useState } from "react";
import { DailyPlan, Project, QuickCapture, Task } from "@/types/database";
import { updateDailyPlan, completeDailyPlan } from "@/lib/actions/daily-plans";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, Loader2, Save, Moon, BookOpen, MessageSquareText } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { TodayReview } from "@/components/features/plan/TodayReview";
import { AIRecommendation } from "@/components/features/plan/AIRecommendation";
import { CaptureTriage } from "@/components/features/plan/CaptureTriage";
import { TaskCommitment } from "@/components/features/plan/TaskCommitment";

interface PlanEditorProps {
    initialPlan: DailyPlan;
    recommendation: {
        recommendedProject: Project | null;
        reason: string;
    } | null;
    captures: QuickCapture[];
    projects: (Project & { tasks: Task[] })[];
    stats: {
        completed: number;
        inProgress: number;
        focusMinutes: number;
    };
}

export function PlanEditor({ initialPlan, recommendation, captures, projects, stats }: PlanEditorProps) {
    const [plan, setPlan] = useState(initialPlan);
    const [reflection, setReflection] = useState(plan.reflection_notes || "");
    const [closingNotes, setClosingNotes] = useState(plan.plan_notes || "");
    const [isSaving, setIsSaving] = useState(false);

    async function handleSave() {
        setIsSaving(true);
        try {
            await updateDailyPlan(plan.id, {
                reflection_notes: reflection,
                plan_notes: closingNotes
            });
            toast.success("Saved", { description: "Your plan progress is stored." });
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
            toast.success("Day Completed", { description: "Rest well. Tomorrow is a new start." });
        } catch (error) {
            toast.error("Failed to complete day");
        }
    }

    return (
        <div className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Phase 1: Review */}
            <div className="space-y-8">
                <TodayReview stats={stats} />
                
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-green-500" />
                        1. Daily Reflection
                    </h2>
                    <p className="text-sm text-muted-foreground">What were your wins today? What did you learn?</p>
                    <Textarea 
                        value={reflection}
                        onChange={(e) => setReflection(e.target.value)}
                        placeholder="Reflect on your performance and energy..."
                        className="min-h-[120px] resize-none text-base bg-muted/30 focus:bg-background transition-colors"
                    />
                </section>
            </div>

            <Separator className="opacity-50" />

            {/* Phase 2: Input Triage */}
            {captures.length > 0 && (
                <>
                    <CaptureTriage captures={captures} projects={projects} />
                    <Separator className="opacity-50" />
                </>
            )}

            {/* Phase 3: Alignment */}
            <AIRecommendation 
                planId={plan.id} 
                recommendation={recommendation ? { 
                    project: recommendation.recommendedProject!, 
                    reason: recommendation.reason,
                    score: 0 // Not used in UI but for type safety
                } : null}
                currentRecommendationText={plan.ai_recommendation_text}
            />

            <Separator className="opacity-50" />

            {/* Phase 4: Commitment */}
            <TaskCommitment projects={projects} />

            <Separator className="opacity-50" />

            {/* Phase 5: Closing */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <MessageSquareText className="w-5 h-5 text-purple-500" />
                     Closing Thoughts
                </h2>
                <p className="text-sm text-muted-foreground">Any high-level focus or reminders for tomorrow?</p>
                <Textarea 
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    placeholder="Focus for tomorrow is..."
                    className="min-h-[100px] resize-none text-base bg-muted/30 focus:bg-background transition-colors"
                />
            </section>

            {/* Footer Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t p-6 z-50">
                <div className="container max-w-3xl flex justify-between items-center">
                    <div className="text-sm text-muted-foreground italic">
                        {plan.is_completed ? "Day is finalized." : "Drafts save automatically when you save."}
                    </div>
                    <div className="flex gap-4">
                        <Button variant="ghost" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Draft
                        </Button>
                        <Button 
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                            onClick={handleComplete} 
                            disabled={isSaving || (plan.is_completed ?? false)}
                        >
                            {plan.is_completed ? (
                                <>
                                    <Moon className="w-4 h-4 mr-2" />
                                    Resting Mode
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Complete & Close Day
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

