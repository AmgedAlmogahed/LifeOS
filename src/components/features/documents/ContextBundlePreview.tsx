"use client";

import { useState } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
    BrainCircuit, 
    Copy, 
    RefreshCcw, 
    Check, 
    AlertCircle,
    Terminal,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generateContextBundle } from "@/lib/actions/documents";
import { toast } from "sonner";

interface ContextBundlePreviewProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'client' | 'project';
    entityId: string;
    entityName: string;
    initialContext?: string | null;
    isStale?: boolean;
}

export function ContextBundlePreview({ 
    isOpen, 
    onClose, 
    type, 
    entityId, 
    entityName, 
    initialContext,
    isStale: initialIsStale 
}: ContextBundlePreviewProps) {
    const [context, setContext] = useState(initialContext || "");
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isStale, setIsStale] = useState(initialIsStale || false);
    const [copied, setCopied] = useState(false);

    const handleRegenerate = async () => {
        setIsRegenerating(true);
        try {
            const newContext = await generateContextBundle(type, entityId);
            setContext(newContext);
            setIsStale(false);
            toast.success("Context bundle regenerated successfully.");
        } catch (err: any) {
            toast.error(`Failed to regenerate context: ${err.message}`);
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(context);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.info("Copied to clipboard");
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0">
                <div className="p-6 pb-4 border-b">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                                <BrainCircuit className="w-6 h-6 text-primary" />
                                Agent Context Bundle
                            </DialogTitle>
                            {isStale && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                    <AlertCircle className="w-3 h-3" />
                                    Stale - Update Required
                                </div>
                            )}
                        </div>
                        <DialogDescription className="mt-1.5 flex items-center gap-2">
                            Compiled context for <span className="text-primary font-semibold">{entityName}</span>
                            <span className="text-muted-foreground/40">•</span>
                            <span>{context ? `${context.split(' ').length} words` : 'Empty'}</span>
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-muted/10 font-mono text-sm leading-relaxed">
                    {!context && !isRegenerating ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                            <Terminal className="w-12 h-12 mb-4" />
                            <p>No context bundle generated yet.</p>
                            <Button variant="link" onClick={handleRegenerate} className="mt-2 text-primary">
                                Generate now
                            </Button>
                        </div>
                    ) : (
                        <div className="relative group rounded-lg border bg-card/50 p-4 min-h-[300px]">
                             <pre className="whitespace-pre-wrap break-words text-xs text-muted-foreground select-all">
                                {context || "Regenerating..."}
                             </pre>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-card flex items-center justify-between">
                    <div className="text-xs text-muted-foreground flex items-center gap-4">
                         <div className="flex flex-col">
                            <span className="font-bold uppercase text-[9px] text-muted-foreground/60 tracking-widest">Visibility</span>
                            <span>System Agent Only</span>
                         </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleCopy} disabled={!context}>
                            {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                            Copy Markdown
                        </Button>
                        <Button 
                            className="bg-primary hover:bg-primary/90 min-w-[140px]"
                            size="sm"
                            onClick={handleRegenerate}
                            disabled={isRegenerating}
                        >
                            {isRegenerating ? (
                                <><RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> Regenerating...</>
                            ) : (
                                <><RefreshCcw className="w-4 h-4 mr-2" /> {context ? 'Regenerate' : 'Generate'}</>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
