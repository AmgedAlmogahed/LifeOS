"use client";

import { useTransition, useState } from "react";
import { createFocusSession, endFocusSessionEnhanced } from "@/lib/actions/focus-sessions";
import { Task, Project, FocusSession } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Clock, Timer, Play, Square, CheckSquare, Loader2 } from "lucide-react";

interface FocusControllerProps {
    project: Project;
    initialSession: FocusSession | null;
    tasks: Task[];
}

export function FocusController({ project, initialSession, tasks }: FocusControllerProps) {
    const [isPending, startTransition] = useTransition();
    const [session, setSession] = useState(initialSession);
    const [isEndModalOpen, setIsEndModalOpen] = useState(false);

    // Debrief state
    const [taskId, setTaskId] = useState("");
    const [taskStatus, setTaskStatus] = useState("Done");
    const [accomplished, setAccomplished] = useState("");
    const [blockers, setBlockers] = useState("");
    const [nextStep, setNextStep] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleStart = () => {
        startTransition(async () => {
            const newSession = await createFocusSession(project.id);
            setSession(newSession);
        });
    };

    const handleEnd = () => {
        if (!accomplished.trim()) {
            setError("You must summarize what you accomplished.");
            return;
        }
        if (!taskId) {
            setError("Please select the primary task you worked on.");
            return;
        }

        startTransition(async () => {
            if (session) {
                await endFocusSessionEnhanced(session.id, project.id, {
                    taskId,
                    taskStatus,
                    accomplished,
                    blockers: taskStatus === "Blocked" ? blockers : undefined,
                    nextStep
                });
                setSession(null);
                setIsEndModalOpen(false);
                // reset state
                setAccomplished("");
                setBlockers("");
                setNextStep("");
                setTaskId("");
                setError(null);
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
                    {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2 fill-current" />}
                    Start Session
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
                    <Square className="w-4 h-4 mr-2 fill-current" /> End & Debrief
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
                            <input type="checkbox" className="w-5 h-5 rounded border-secondary-foreground/20 text-primary focus:ring-primary cursor-pointer" />
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

            {/* End Session Modal - Mandatory Debrief */}
            <Dialog open={isEndModalOpen} onOpenChange={setIsEndModalOpen}>
                <DialogContent onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()} className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Session Debrief</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {error && <div className="text-xs bg-destructive/10 text-destructive p-2 rounded-md font-medium">{error}</div>}
                        
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Primary Task Worked On <span className="text-red-500">*</span></label>
                            <select 
                                value={taskId} 
                                onChange={(e) => setTaskId(e.target.value)}
                                className="w-full text-sm p-2 rounded-md bg-background border border-border focus:ring-1 focus:ring-primary outline-none"
                            >
                                <option value="" disabled>Select a task...</option>
                                {tasks.map((t) => (
                                    <option key={t.id} value={t.id}>{t.title}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Task Status <span className="text-red-500">*</span></label>
                            <div className="flex gap-2">
                                {["Done", "In Progress", "Blocked"].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setTaskStatus(status)}
                                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors border ${
                                            taskStatus === status 
                                            ? "border-primary bg-primary/10 text-primary" 
                                            : "border-border bg-accent/30 text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                             <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">What did you accomplish? <span className="text-red-500">*</span></label>
                             <Textarea 
                                placeholder="Summarize your work during this session..."
                                value={accomplished}
                                onChange={(e) => setAccomplished(e.target.value)}
                                className="resize-none min-h-[80px] bg-background text-sm"
                             />
                        </div>

                        {taskStatus === "Blocked" && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-amber-500">Blockers <span className="text-red-500">*</span></label>
                                <Textarea 
                                    placeholder="What's blocking you from completing this?"
                                    value={blockers}
                                    onChange={(e) => setBlockers(e.target.value)}
                                    className="resize-none min-h-[60px] bg-amber-500/5 text-sm border-amber-500/20 focus-visible:ring-amber-500"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Next Step (Optional)</label>
                            <Input 
                                placeholder="What should happen next?"
                                value={nextStep}
                                onChange={(e) => setNextStep(e.target.value)}
                                className="bg-background text-sm"
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button variant="default" onClick={handleEnd} disabled={isPending} className="w-full sm:w-auto px-8">
                                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckSquare className="w-4 h-4 mr-2" />}
                                Complete Debrief
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
