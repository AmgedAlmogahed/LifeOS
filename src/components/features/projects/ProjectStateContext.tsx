"use client";

import { useState, useTransition } from "react";
import { AlertCircle, ChevronRight, Edit3, Loader2, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { upsertProjectStateContext } from "@/lib/actions/project-state-context";
import type { ProjectStateContext as PSC } from "@/types/database";
import { formatDistanceToNow } from "date-fns";

interface ProjectStateContextProps {
    context: PSC | null;
    projectId: string;
}

export function ProjectStateContext({ context, projectId }: ProjectStateContextProps) {
    const [isPending, startTransition] = useTransition();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        context_summary: context?.context_summary || "",
        last_decision: context?.last_decision || "",
        next_action: context?.next_action || "",
        current_blockers: context?.current_blockers?.join("\n") || "",
    });

    const handleSave = () => {
        startTransition(async () => {
            await upsertProjectStateContext(projectId, {
                context_summary: form.context_summary,
                last_decision: form.last_decision,
                next_action: form.next_action,
                current_blockers: form.current_blockers
                    .split("\n")
                    .map(s => s.trim())
                    .filter(Boolean),
            });
            setEditing(false);
        });
    };

    if (!context && !editing) {
        return (
            <div className="rounded-xl border border-dashed border-border bg-muted/10 p-6 text-center">
                <p className="text-sm text-muted-foreground mb-3">No project context set yet.</p>
                <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-1.5">
                    <Edit3 className="w-3.5 h-3.5" /> Set Context
                </Button>
            </div>
        );
    }

    if (editing) {
        return (
            <div className="rounded-xl border border-primary/20 bg-card p-5 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">Project Context</h3>

                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Summary</label>
                        <Textarea
                            value={form.context_summary}
                            onChange={(e) => setForm({ ...form, context_summary: e.target.value })}
                            className="min-h-[60px] resize-none"
                            placeholder="What's the current state of this project?"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Last Decision</label>
                        <Input
                            value={form.last_decision}
                            onChange={(e) => setForm({ ...form, last_decision: e.target.value })}
                            placeholder="e.g. Approved design v2"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Next Action</label>
                        <Input
                            value={form.next_action}
                            onChange={(e) => setForm({ ...form, next_action: e.target.value })}
                            placeholder="e.g. Implement auth flow"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Blockers (one per line)</label>
                        <Textarea
                            value={form.current_blockers}
                            onChange={(e) => setForm({ ...form, current_blockers: e.target.value })}
                            className="min-h-[40px] resize-none"
                            placeholder="API key pending\nDesign review needed"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleSave} disabled={isPending} className="gap-1.5">
                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5" /> Project Context
                </h3>
                <div className="flex items-center gap-2">
                    {context?.updated_at && (
                        <span className="text-[10px] text-muted-foreground/60">
                            {formatDistanceToNow(new Date(context.updated_at), { addSuffix: true })}
                        </span>
                    )}
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditing(true)}>
                        <Edit3 className="w-3 h-3" />
                    </Button>
                </div>
            </div>

            {/* Summary */}
            <p className="text-sm text-foreground leading-relaxed">{context!.context_summary}</p>

            {/* Key fields */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Last Decision</span>
                    <p className="text-sm text-foreground">{context!.last_decision || "—"}</p>
                </div>
                <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Next Action</span>
                    <p className="text-sm text-primary font-medium flex items-center gap-1">
                        <ChevronRight className="w-3 h-3" /> {context!.next_action || "—"}
                    </p>
                </div>
            </div>

            {/* Blockers */}
            {context!.current_blockers && context!.current_blockers.length > 0 && (
                <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-red-500 uppercase flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Blockers
                    </span>
                    {context!.current_blockers.map((b, i) => (
                        <div key={i} className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5">
                            {b}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
