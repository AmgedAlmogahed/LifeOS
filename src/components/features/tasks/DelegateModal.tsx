"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Bot, Loader2 } from "lucide-react";
import { createDelegation } from "@/lib/actions/delegation";
import { toast } from "sonner";
import { AGENT_IDS, type AgentId } from "@/types/database";

interface DelegateModalProps {
    taskId: string;
    isOpen: boolean;
    onClose: () => void;
    taskCategory?: string | null;
    devType?: string | null;
}

const AGENT_DESCRIPTIONS: Record<AgentId, { label: string; description: string; color: string }> = {
    Secretary: { label: "Secretary", description: "Planning, scheduling, admin tasks", color: "text-blue-500" },
    Dev: { label: "Dev Agent", description: "Implementation, debugging, DevOps", color: "text-green-500" },
    Biz: { label: "Biz Agent", description: "Clients, contracts, business ops", color: "text-purple-500" },
    Creative: { label: "Creative Agent", description: "Design, marketing, content", color: "text-pink-500" },
    Accounting: { label: "Accounting Agent", description: "Finance, invoices, expenses", color: "text-amber-500" },
};

export function DelegateModal({ taskId, isOpen, onClose, taskCategory, devType }: DelegateModalProps) {
    const [isPending, startTransition] = useTransition();
    const [selectedAgent, setSelectedAgent] = useState<AgentId | "">("");
    const [notes, setNotes] = useState("");

    // Auto-suggest agent based on task context
    const getSuggestedAgent = (): AgentId | null => {
        if (devType || taskCategory === "Implementation") return "Dev";
        if (taskCategory === "Business" || taskCategory === "Social") return "Biz";
        if (taskCategory === "Personal") return "Secretary";
        return null;
    };

    const suggestedAgent = getSuggestedAgent();

    const handleSubmit = () => {
        if (!selectedAgent) return;

        startTransition(async () => {
            try {
                await createDelegation({ task_id: taskId, agent_id: selectedAgent });
                toast.success("Task delegated", { description: `Assigned to ${AGENT_DESCRIPTIONS[selectedAgent].label}` });
                setSelectedAgent("");
                setNotes("");
                onClose();
            } catch (err) {
                toast.error("Failed to delegate task");
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bot className="w-5 h-5" /> Delegate to Agent
                    </DialogTitle>
                    <DialogDescription>
                        Choose an agent to handle this task. The agent will pick it up automatically.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Agent selector */}
                    <div className="space-y-2">
                        <Label>Agent</Label>
                        <Select value={selectedAgent} onValueChange={(v) => setSelectedAgent(v as AgentId)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an agent..." />
                            </SelectTrigger>
                            <SelectContent>
                                {AGENT_IDS.map((agent) => (
                                    <SelectItem key={agent} value={agent}>
                                        <div className="flex items-center gap-2">
                                            <span className={`font-medium ${AGENT_DESCRIPTIONS[agent].color}`}>
                                                {AGENT_DESCRIPTIONS[agent].label}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                — {AGENT_DESCRIPTIONS[agent].description}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {suggestedAgent && !selectedAgent && (
                            <p className="text-xs text-muted-foreground">
                                Suggested: <button className="text-primary underline" onClick={() => setSelectedAgent(suggestedAgent)}>
                                    {AGENT_DESCRIPTIONS[suggestedAgent].label}
                                </button>
                            </p>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label>Delegation notes (optional)</Label>
                        <Textarea
                            placeholder="Any context or instructions for the agent..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="min-h-[60px] resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={onClose} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={isPending || !selectedAgent}>
                            {isPending ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Delegating...</>
                            ) : (
                                "Delegate"
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
