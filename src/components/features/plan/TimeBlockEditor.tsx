"use client";

import { useState, useTransition, useCallback } from "react";
import { Plus, Trash2, GripVertical, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TimeBlock {
    id: string;
    start: string; // "HH:mm"
    end: string;   // "HH:mm"
    label: string;
    color: string;
    taskId?: string;
}

interface TimeBlockEditorProps {
    initialBlocks: TimeBlock[];
    onSave: (blocks: TimeBlock[]) => Promise<void>;
    tasks?: { id: string; title: string }[];
}

const HOUR_RANGE = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00 – 22:00
const COLORS = [
    "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b",
    "#10b981", "#06b6d4", "#3b82f6", "#f97316", "#84cc16",
];

function generateId() {
    return Math.random().toString(36).slice(2, 9);
}

function timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

function minutesToPercent(minutes: number): number {
    // 08:00 = 0%, 22:00 = 100%
    return ((minutes - 480) / (14 * 60)) * 100;
}

export function TimeBlockEditor({ initialBlocks, onSave, tasks = [] }: TimeBlockEditorProps) {
    const [blocks, setBlocks] = useState<TimeBlock[]>(initialBlocks);
    const [isPending, startTransition] = useTransition();
    const [dirty, setDirty] = useState(false);

    const addBlock = useCallback(() => {
        // Find next free slot
        const lastEnd = blocks.length > 0
            ? blocks[blocks.length - 1].end
            : "09:00";
        const [h, m] = lastEnd.split(":").map(Number);
        const newStart = lastEnd;
        const newEnd = `${String(Math.min(h + 1, 22)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

        setBlocks(prev => [...prev, {
            id: generateId(),
            start: newStart,
            end: newEnd,
            label: "",
            color: COLORS[prev.length % COLORS.length],
        }]);
        setDirty(true);
    }, [blocks]);

    const updateBlock = useCallback((id: string, updates: Partial<TimeBlock>) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
        setDirty(true);
    }, []);

    const removeBlock = useCallback((id: string) => {
        setBlocks(prev => prev.filter(b => b.id !== id));
        setDirty(true);
    }, []);

    const handleSave = () => {
        startTransition(async () => {
            await onSave(blocks);
            setDirty(false);
        });
    };

    return (
        <div className="space-y-4">
            {/* Timeline visualization */}
            <div className="relative bg-muted/20 border border-border rounded-xl p-4">
                {/* Hour labels */}
                <div className="flex items-center justify-between mb-2 px-0.5">
                    {HOUR_RANGE.map(h => (
                        <span key={h} className="text-[9px] text-muted-foreground/50 font-mono">
                            {String(h).padStart(2, "0")}
                        </span>
                    ))}
                </div>

                {/* Timeline track */}
                <div className="relative h-12 bg-muted/30 rounded-lg border border-border/50 overflow-hidden">
                    {/* Hour gridlines */}
                    {HOUR_RANGE.map(h => (
                        <div key={h} className="absolute top-0 bottom-0 w-px bg-border/30"
                             style={{ left: `${minutesToPercent(h * 60)}%` }} />
                    ))}

                    {/* Blocks */}
                    {blocks.map((block) => {
                        const startPct = minutesToPercent(timeToMinutes(block.start));
                        const endPct = minutesToPercent(timeToMinutes(block.end));
                        const width = endPct - startPct;

                        return (
                            <div
                                key={block.id}
                                className="absolute top-1 bottom-1 rounded-md flex items-center justify-center text-[10px] font-medium text-white overflow-hidden transition-all"
                                style={{
                                    left: `${Math.max(0, startPct)}%`,
                                    width: `${Math.max(2, width)}%`,
                                    backgroundColor: block.color,
                                    opacity: 0.85,
                                }}
                            >
                                <span className="truncate px-1">{block.label || "…"}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Block list editor */}
            <div className="space-y-2">
                {blocks.map((block, i) => (
                    <div key={block.id} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors">
                        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />

                        {/* Color swatch */}
                        <button
                            className="w-5 h-5 rounded-md shrink-0 border border-border"
                            style={{ backgroundColor: block.color }}
                            onClick={() => updateBlock(block.id, {
                                color: COLORS[(COLORS.indexOf(block.color) + 1) % COLORS.length]
                            })}
                        />

                        {/* Time inputs */}
                        <Input
                            type="time"
                            value={block.start}
                            onChange={(e) => updateBlock(block.id, { start: e.target.value })}
                            className="w-24 h-8 text-xs font-mono"
                        />
                        <span className="text-xs text-muted-foreground">–</span>
                        <Input
                            type="time"
                            value={block.end}
                            onChange={(e) => updateBlock(block.id, { end: e.target.value })}
                            className="w-24 h-8 text-xs font-mono"
                        />

                        {/* Label */}
                        <Input
                            value={block.label}
                            onChange={(e) => updateBlock(block.id, { label: e.target.value })}
                            placeholder="Block label..."
                            className="flex-1 h-8 text-sm"
                        />

                        {/* Task Select (Optional) */}
                        {tasks.length > 0 && (
                            <select
                                className="h-8 text-[10px] sm:text-xs rounded-md border border-input bg-background px-2 overflow-hidden max-w-[120px]"
                                value={block.taskId || ""}
                                onChange={(e) => updateBlock(block.id, { taskId: e.target.value || undefined })}
                            >
                                <option value="">No Task</option>
                                {tasks.map(t => (
                                    <option key={t.id} value={t.id} title={t.title}>
                                        {t.title.substring(0, 20)}{t.title.length > 20 ? "..." : ""}
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* Delete */}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500 shrink-0"
                                onClick={() => removeBlock(block.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={addBlock} className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Add Block
                </Button>

                <Button size="sm" onClick={handleSave} disabled={isPending || !dirty} className="gap-1.5">
                    {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Blocks
                </Button>
            </div>
        </div>
    );
}
