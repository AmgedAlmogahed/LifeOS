"use client";

import { useState } from "react";
import { QuickCapture, Task } from "@/types/database";
import { processCapture, dismissCapture } from "@/lib/actions/captures";
import { createTask, updateTask } from "@/lib/actions/tasks";
import { Check, X, ArrowRight, Trash2, Calendar, Folder } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface InboxClientProps {
    initialCaptures: QuickCapture[];
    initialTasks: Task[];
    projects: { id: string; name: string }[];
}

export function InboxClient({ initialCaptures, initialTasks, projects }: InboxClientProps) {
    const [captures, setCaptures] = useState(initialCaptures); // Ideally rely on server state via router refresh
    // For simplicity, just render initial props. Server actions revalidatePath refreshes the page.
    // But optimistic updates are better.
    
    const [selectedCapture, setSelectedCapture] = useState<QuickCapture | null>(null);
    const [targetProjectId, setTargetProjectId] = useState<string | null>(null);

    async function onDismiss(id: string) {
        // Optimistic remove?
        await dismissCapture(id);
    }
    
    async function onConvertToTask() {
        if (!selectedCapture) return;
        
        // Create task
        const newTask = await createTask({
            title: selectedCapture.raw_text,
            project_id: targetProjectId, // null means Personal
            status: "Todo",
            priority: "Medium",
            type: "Implementation",
            is_recurring: false,
            reminder_sent: false,
            // category: category based on project?
            // defaults
        } as any); // Cast to TaskInsert to ignore missing fields if any
        
        // Mark capture as processed
        await processCapture(selectedCapture.id, newTask.id);
        
        setSelectedCapture(null);
        setTargetProjectId(null);
    }

    return (
        <div className="container max-w-4xl py-8 px-4 space-y-8">
            <h1 className="text-2xl font-bold mb-6">Inbox</h1>

            {/* Unprocessed Captures */}
            <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    Unprocessed Captures ({initialCaptures.length})
                </h2>
                
                <div className="space-y-3">
                    {initialCaptures.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic"> Inbox zero. Nice work.</p>
                    ) : (
                        initialCaptures.map(capture => (
                            <div key={capture.id} className="group bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition-all">
                                <div className="flex-1 mr-4">
                                    <p className="text-foreground">{capture.raw_text}</p>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Captured {formatDistanceToNow(new Date(capture.created_at))} ago via {capture.source}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="sm" variant="outline" onClick={() => setSelectedCapture(capture)}>
                                        <ArrowRight className="w-4 h-4 mr-1" /> Task
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => onDismiss(capture.id)}>
                                        <X className="w-4 h-4 text-muted-foreground hover:text-red-500 transition-colors" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Unplanned Tasks */}
            <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                    <Folder className="w-4 h-4" /> Unplanned Tasks ({initialTasks.length})
                </h2>
                 <div className="space-y-3">
                    {initialTasks.map(task => (
                        <div key={task.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                 <div className={`w-3 h-3 rounded-full border ${task.status === 'Done' ? 'bg-green-500 border-green-500' : 'border-muted-foreground'}`} />
                                 <span className={task.status === 'Done' ? 'line-through text-muted-foreground' : ''}>{task.title}</span>
                             </div>
                             {/* Project assignment logic could be here too */}
                        </div>
                    ))}
                 </div>
            </section>

            {/* Convert Modal */}
            <Dialog open={!!selectedCapture} onOpenChange={(o) => !o && setSelectedCapture(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Convert to Task</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="font-medium">"{selectedCapture?.raw_text}"</p>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Assign Project</label>
                            <select 
                                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
        </div>
    );
}
