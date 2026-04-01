"use client";

import { useState, useMemo } from "react";
import { DailyPlan, Project, QuickCapture, Task } from "@/types/database";
import { updateDailyPlan, completeDailyPlan } from "@/lib/actions/daily-plans";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, Loader2, Save, Moon, Sun, BookOpen, MessageSquareText, CalendarClock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { TodayReview } from "@/components/features/plan/TodayReview";
import { AIRecommendation } from "@/components/features/plan/AIRecommendation";
import { CaptureTriage } from "@/components/features/plan/CaptureTriage";
import { TaskCommitment } from "@/components/features/plan/TaskCommitment";
import { TimeBlockEditor } from "@/components/features/plan/TimeBlockEditor";
import { cn } from "@/lib/utils";

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

    // Morning / Evening mode
    const currentHour = new Date().getHours();
    const [mode, setMode] = useState<"morning" | "evening">(currentHour < 15 ? "morning" : "evening");

    // Parse time_blocks from plan
    const initialTimeBlocks = useMemo(() => {
        const raw = (plan as any).time_blocks;
        if (!raw) return [];
        try {
            const blocks = typeof raw === "string" ? JSON.parse(raw) : raw;
            if (!Array.isArray(blocks)) return [];
            return blocks.map((b: any, i: number) => ({
                id: b.id || Math.random().toString(36).slice(2, 9),
                start: b.start || "09:00",
                end: b.end || "10:00",
                label: b.label || b.type || "",
                color: b.color || "#6366f1",
                taskId: b.task_id || undefined,
            }));
        } catch { return []; }
    }, [plan]);

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

            {/* Mode Toggle */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setMode("morning")}
                    className={cn(
                        "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        mode === "morning"
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Sun className="w-4 h-4" /> Morning Plan
                </button>
                <button
                    onClick={() => setMode("evening")}
                    className={cn(
                        "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        mode === "evening"
                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Moon className="w-4 h-4" /> Evening Reflect
                </button>
            </div>
            {/* Phase 1: Review (Evening) */}
            {mode === "evening" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
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
                    <Separator className="opacity-50" />
                </div>
            )}

            {/* Phase 2: Input Triage */}
            {captures.length > 0 && (
                <>
                    <CaptureTriage captures={captures} projects={projects} />
                    <Separator className="opacity-50" />
                </>
            )}

            {/* Phase 3: Alignment (Morning) */}
            {mode === "morning" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <AIRecommendation 
                        planId={plan.id} 
                        recommendation={recommendation ? { 
                            project: recommendation.recommendedProject!, 
                            reason: recommendation.reason,
                            score: 0 
                        } : null}
                        currentRecommendationText={plan.ai_recommendation_text}
                    />
                    <Separator className="opacity-50" />
                </div>
            )}

            {/* Phase 4: Commitment (Morning) */}
            {mode === "morning" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <TaskCommitment projects={projects} />
                    <Separator className="opacity-50" />
                </div>
            )}

            {/* Phase 4.5: Time Block Editor */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <CalendarClock className="w-5 h-5 text-cyan-500" />
                    {mode === "morning" ? "Plan Tomorrow's Time Blocks" : "Review & Adjust Time Blocks"}
                </h2>
                <p className="text-sm text-muted-foreground">
                    {mode === "morning"
                        ? "Set your time blocks for the day ahead. Blocks auto-save when you hit 'Save Blocks'."
                        : "Review how today's blocks went. Adjust for tomorrow if needed."
                    }
                </p>
                <TimeBlockEditor
                    tasks={projects.flatMap(p => p.tasks).map(t => ({ id: t.id, title: t.title }))}
                    initialBlocks={initialTimeBlocks}
                    onSave={async (blocks) => {
                        const dbBlocks = blocks.map(b => ({
                            start: b.start,
                            end: b.end,
                            task_id: b.taskId || null,
                            type: b.label || "focus",
                            label: b.label,
                            color: b.color,
                            id: b.id,
                        }));
                        await updateDailyPlan(plan.id, { time_blocks: dbBlocks } as any);
                        toast.success("Time blocks saved");
                    }}
                />
            </section>

            {/* Phase 5: Closing (Evening) */}
            {mode === "evening" && (
                <section className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
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
            )}

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

