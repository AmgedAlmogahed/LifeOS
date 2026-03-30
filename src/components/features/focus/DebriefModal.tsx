"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { endFocusSession } from "@/lib/actions/focus-sessions";
import { updateTask } from "@/lib/actions/tasks";
import { createStateSnapshot } from "@/lib/actions/state-snapshots";
import { upsertProjectStateContext } from "@/lib/actions/project-state-context";

export interface DebriefData {
    accomplishment: string;
    taskStatus: "Done" | "In Progress" | "Blocked";
    blockReason?: string;
    nextStep?: string;
}

interface DebriefModalProps {
    isOpen: boolean;
    sessionId: string;
    projectId: string;
    taskId: string;
    taskTitle: string;
    onComplete: () => void;
}

export function DebriefModal({
    isOpen,
    sessionId,
    projectId,
    taskId,
    taskTitle,
    onComplete,
}: DebriefModalProps) {
    const [isPending, startTransition] = useTransition();
    const [accomplishment, setAccomplishment] = useState("");
    const [taskStatus, setTaskStatus] = useState<"Done" | "In Progress" | "Blocked">("In Progress");
    const [blockReason, setBlockReason] = useState("");
    const [nextStep, setNextStep] = useState("");
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const isValid = accomplishment.trim().length > 0;

    const handleSubmit = () => {
        if (!isValid) {
            setError("Please describe what you accomplished.");
            return;
        }
        setError(null);

        startTransition(async () => {
            try {
                // 1. End focus session with notes
                const notes = [
                    `## Accomplishment\n${accomplishment}`,
                    `**Status**: ${taskStatus}`,
                    blockReason ? `**Blocker**: ${blockReason}` : null,
                    nextStep ? `**Next Step**: ${nextStep}` : null,
                ].filter(Boolean).join("\n\n");

                await endFocusSession(sessionId, notes);

                // 2. Update task status
                const taskUpdate: Record<string, any> = { status: taskStatus };
                if (taskStatus === "Done") {
                    taskUpdate.completed_at = new Date().toISOString();
                    taskUpdate.is_current = false;
                }
                await updateTask(taskId, taskUpdate);

                // 3. Create state snapshot
                await createStateSnapshot({
                    project_id: projectId,
                    snapshot_text: `Focus session ended. ${accomplishment}${nextStep ? ` Next: ${nextStep}` : ""}`,
                    trigger: "focus_exit",
                });

                // 4. Update project state context
                await upsertProjectStateContext(projectId, {
                    context_summary: `Last focus: ${accomplishment}`,
                    next_action: nextStep || "Review and pick next task",
                    current_blockers: taskStatus === "Blocked" && blockReason 
                        ? [blockReason] 
                        : [],
                    last_decision: `Task "${taskTitle}" marked as ${taskStatus}`,
                });

                onComplete();
            } catch (err) {
                console.error("Debrief submission error:", err);
                setError("Failed to save debrief. Please try again.");
            }
        });
    };

    // Keyboard handler — prevent Escape
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onKeyDown={handleKeyDown}
            // No click-outside-to-close
        >
            <div 
                className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header — No close button */}
                <div className="space-y-1">
                    <h2 className="text-xl font-bold">Session Debrief</h2>
                    <p className="text-sm text-muted-foreground">
                        Complete this debrief to end your focus session. This cannot be skipped.
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        {error}
                    </div>
                )}

                {/* 1. Accomplishment (required) */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium">
                        What did you accomplish? <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                        placeholder="Describe what you got done during this session..."
                        value={accomplishment}
                        onChange={(e) => setAccomplishment(e.target.value)}
                        className="min-h-[100px] resize-none"
                        autoFocus
                    />
                </div>

                {/* 2. Task Status */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium">Task status</Label>
                    <RadioGroup
                        value={taskStatus}
                        onValueChange={(v: string) => setTaskStatus(v as typeof taskStatus)}
                        className="flex gap-4"
                    >
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                            <RadioGroupItem value="Done" id="status-done" />
                            <Label htmlFor="status-done" className="flex items-center gap-1.5 cursor-pointer text-sm">
                                <CheckCircle2 className="w-4 h-4 text-green-500" /> Done
                            </Label>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                            <RadioGroupItem value="In Progress" id="status-progress" />
                            <Label htmlFor="status-progress" className="flex items-center gap-1.5 cursor-pointer text-sm">
                                <Clock className="w-4 h-4 text-blue-500" /> In Progress
                            </Label>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                            <RadioGroupItem value="Blocked" id="status-blocked" />
                            <Label htmlFor="status-blocked" className="flex items-center gap-1.5 cursor-pointer text-sm">
                                <AlertCircle className="w-4 h-4 text-red-500" /> Blocked
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* 3. Block reason (conditional) */}
                {taskStatus === "Blocked" && (
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">What&apos;s blocking you?</Label>
                        <Textarea
                            placeholder="Describe the blocker..."
                            value={blockReason}
                            onChange={(e) => setBlockReason(e.target.value)}
                            className="min-h-[60px] resize-none"
                        />
                    </div>
                )}

                {/* 4. Next step */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Next step (optional)</Label>
                    <Input
                        placeholder="What should be done next?"
                        value={nextStep}
                        onChange={(e) => setNextStep(e.target.value)}
                    />
                </div>

                {/* Submit */}
                <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={isPending || !isValid}
                >
                    {isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                    ) : (
                        "Complete Debrief & End Session"
                    )}
                </Button>
            </div>
        </div>
    );
}
