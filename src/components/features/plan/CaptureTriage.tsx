"use client";

import { useState } from "react";
import { QuickCapture } from "@/types/database";
import { Button } from "@/components/ui/button";
import { ArrowRight, Inbox, X, Calendar } from "lucide-react";
import { dismissCapture, processCapture } from "@/lib/actions/captures";
import { createTask } from "@/lib/actions/tasks";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CaptureTriageProps {
    captures: QuickCapture[];
    projects: { id: string; name: string }[];
}

export function CaptureTriage({ captures, projects }: CaptureTriageProps) {
    // We can reuse logic from InboxClient or simplified for Plan.
    // Let's implement inline functionality as per spec: [-> Task] [Dismiss]

    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedCapture, setSelectedCapture] = useState<QuickCapture | null>(null);
    const [targetProjectId, setTargetProjectId] = useState<string | null>(null);

    async function handleDismiss(id: string) {
        setProcessingId(id);
        try {
            await dismissCapture(id);
            toast.success("Capture dismissed");
        } catch {
            toast.error("Failed to dismiss");
        } finally {
            setProcessingId(null);
        }
    }

    async function onConvertToTask() {
        if (!selectedCapture) return;
        
        try {
            const newTask = await createTask({
                title: selectedCapture.raw_text,
                project_id: targetProjectId, 
                status: "Todo",
                priority: "Medium",
                type: "Implementation",
                is_recurring: false,
                reminder_sent: false,
                updated_at: new Date().toISOString()
            } as any);
            
            await processCapture(selectedCapture.id, newTask.id);
            toast.success("Converted to task");
            setSelectedCapture(null);
            setTargetProjectId(null);
        } catch (e) {
            toast.error("Failed to convert");
        }
    }

    if (!captures || captures.length === 0) return null;

    return (
        <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
                <Inbox className="w-5 h-5 text-orange-500" />
                Inbox Triage ({captures.length})
            </h2>
            
            <div className="space-y-3">
                {captures.map(capture => (
                    <div key={capture.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between group">
                        <span className="font-medium">{capture.raw_text}</span>
                        <div className="flex items-center gap-2">
                            <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setSelectedCapture(capture)}
                                disabled={processingId === capture.id}
                            >
                                <ArrowRight className="w-4 h-4 mr-1" /> Task
                            </Button>
                            <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleDismiss(capture.id)}
                                disabled={processingId === capture.id}
                            >
                                <X className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Reuse generic dialog logic */}
             <Dialog open={!!selectedCapture} onOpenChange={(o) => !o && setSelectedCapture(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Convert directly to Task</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="font-medium">"{selectedCapture?.raw_text}"</p>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Assign Project</label>
                            <select 
                                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                onChange={(e) => setTargetProjectId(e.target.value || null)}
                                value={targetProjectId || ""}
                            >
                                <option value="">Personal (No Project)</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="ghost" onClick={() => setSelectedCapture(null)}>Cancel</Button>
                            <Button onClick={onConvertToTask}>Convert</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </section>
    );
}
