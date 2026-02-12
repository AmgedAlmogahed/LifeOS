"use client";

import { useTransition, useState } from "react";
import { createFocusSession, endFocusSession } from "@/lib/actions/focus-sessions";
import { Task, Project, FocusSession } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Timer, Play, Pause, Square, CheckSquare } from "lucide-react";
import { formatDuration, intervalToDuration } from "date-fns";

interface FocusControllerProps {
    project: Project;
    initialSession: FocusSession | null;
    tasks: Task[];
}

export function FocusController({ project, initialSession, tasks }: FocusControllerProps) {
    const [isPending, startTransition] = useTransition();
    const [session, setSession] = useState(initialSession);
    const [sessionNotes, setSessionNotes] = useState("");
    const [isEndModalOpen, setIsEndModalOpen] = useState(false);

    const handleStart = () => {
        startTransition(async () => {
            const newSession = await createFocusSession(project.id);
            setSession(newSession);
        });
    };

    const handleEnd = () => {
        startTransition(async () => {
            if (session) {
                await endFocusSession(session.id, sessionNotes);
                setSession(null);
                setIsEndModalOpen(false);
                setSessionNotes("");
            }
        });
    };

    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl bg-card">
                <Timer className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
                <h2 className="text-xl font-semibold mb-2">Ready to Focus?</h2>
                <p className="text-muted-foreground mb-6 text-center max-w-sm">
                    Start a session to track your time and progress on <strong className="text-foreground">{project.name}</strong>.
                </p>
                <Button size="lg" onClick={handleStart} disabled={isPending} className="px-8 font-semibold">
                    <Play className="w-4 h-4 mr-2 fill-current" /> Start Session
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Active Session Header */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm shadow-primary/10">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)] relative z-10" />
                        <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-primary tracking-tight">Active Focus Session</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Started at {new Date(session.started_at).toLocaleTimeString()}
                        </p>
                    </div>
                </div>
                
                <Button variant="destructive" onClick={() => setIsEndModalOpen(true)} className="w-full md:w-auto">
                    <Square className="w-4 h-4 mr-2 fill-current" /> End Session
                </Button>
            </div>

            {/* Task List */}
            <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-muted-foreground uppercase tracking-wider text-sm">
                    <CheckSquare className="w-4 h-4" /> Tasks
                </h3>
                
                <div className="space-y-2">
                    {tasks.map(task => (
                        <div key={task.id} className="p-4 bg-card border border-border rounded-lg flex items-center gap-4 hover:border-primary/50 transition-colors group cursor-pointer shadow-sm">
                            <input type="checkbox" className="w-5 h-5 rounded border-secondary-foreground/20 text-primary focus:ring-primary cursor-pointer"
                                // onChange -> complete task logic would involve updating optimistic state + server action
                            />
                            <div className="flex-1 min-w-0">
                                <span className="font-medium truncate">{task.title}</span>
                                {task.due_date && <div className="text-xs text-muted-foreground mt-0.5">Due {new Date(task.due_date).toLocaleDateString()}</div>}
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider 
                                ${task.priority === 'High' ? 'bg-red-500/10 text-red-500' : 'bg-muted text-muted-foreground'}`}>
                                {task.priority}
                            </span>
                        </div>
                    ))}
                    {tasks.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground italic bg-muted/20 rounded-xl border border-dashed border-border">
                            No active tasks. Add one or celebrate!
                        </div>
                    )}
                </div>
            </div>

            {/* End Session Modal */}
            <Dialog open={isEndModalOpen} onOpenChange={setIsEndModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>End Focus Session</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                             <label className="text-sm font-medium">Session Notes (Optional)</label>
                             <Textarea 
                                placeholder="What did you accomplish? Any blockers?"
                                value={sessionNotes}
                                onChange={(e) => setSessionNotes(e.target.value)}
                                className="resize-none min-h-[100px]"
                             />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="ghost" onClick={() => setIsEndModalOpen(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleEnd} disabled={isPending}>
                                End & Save
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
