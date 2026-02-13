"use client";

import { useState } from "react";
import { Project } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Check, Edit2 } from "lucide-react";
import { updateDailyPlan } from "@/lib/actions/daily-plans";
import { toast } from "sonner";

interface AIRecommendationProps {
    planId: string;
    recommendation: {
        project: Project;
        reason: string;
        score: number;
    } | null;
    currentRecommendationText: string | null;
}

export function AIRecommendation({ planId, recommendation, currentRecommendationText }: AIRecommendationProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(currentRecommendationText || recommendation?.reason || "");
    const [isSaving, setIsSaving] = useState(false);
    const [accepted, setAccepted] = useState(!!currentRecommendationText);

    if (!recommendation && !currentRecommendationText) return null;

    async function handleAccept() {
        setIsSaving(true);
        try {
            await updateDailyPlan(planId, { ai_recommendation_text: text });
            setAccepted(true);
            setIsEditing(false);
            toast.success("Recommendation accepted");
        } catch (error) {
            toast.error("Failed to accept recommendation");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                AI Recommendation for Tomorrow
            </h2>
            
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm relative overflow-hidden">
                {/* Decorative background vibe */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10">
                    {!isEditing && !accepted ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold">
                                    {recommendation?.project?.name
                                        ? <>Focus on <span className="text-primary">{recommendation.project.name}</span></>
                                        : "AI Recommendation"
                                    }
                                </h3>
                                <p className="text-muted-foreground text-lg">
                                    "{recommendation?.reason || text}"
                                </p>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button onClick={handleAccept} disabled={isSaving}>
                                    <Check className="w-4 h-4 mr-2" />
                                    Accept Recommendation
                                </Button>
                                <Button variant="ghost" onClick={() => setIsEditing(true)}>
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {accepted && !isEditing ? (
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="text-xs text-primary font-bold uppercase tracking-wider flex items-center gap-1">
                                            <Check className="w-3 h-3" /> Accepted
                                        </div>
                                        <p className="text-lg font-medium">{text}</p>
                                    </div>
                                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <label className="text-sm font-medium">Edit Recommendation</label>
                                    <Textarea 
                                        value={text} 
                                        onChange={(e) => setText(e.target.value)}
                                        className="min-h-[100px]"
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                                        <Button onClick={handleAccept} disabled={isSaving}>Save</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
