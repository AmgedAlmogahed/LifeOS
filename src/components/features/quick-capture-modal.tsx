"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createCapture } from "@/lib/actions/captures";
import { Plus, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast"; // Assuming toast exists
import { cn } from "@/lib/utils";

interface QuickCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function QuickCaptureModal({ isOpen, onClose }: QuickCaptureModalProps) {
    const [text, setText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    async function handleSubmit(e?: React.FormEvent) {
        e?.preventDefault();
        if (!text.trim()) return;

        setIsSubmitting(true);
        try {
            await createCapture({
                raw_text: text,
                source: 'web',
                status: 'captured'
            });
            setText("");
            toast({
                title: "Captured ✓",
                description: "Added to your inbox.",
            });
            onClose();
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to capture. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] top-[20%] translate-y-0">
                <DialogHeader className="sr-only">
                    <DialogTitle>Quick Capture</DialogTitle>
                    <DialogDescription>Capture a thought to your inbox.</DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <Textarea 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="What's on your mind?"
                        className="resize-none min-h-[100px] text-lg border-none focus-visible:ring-0 px-0 shadow-none placeholder:text-muted-foreground/50"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                    />
                    
                    <div className="flex items-center justify-between border-t pt-3 mt-2">
                        <span className="text-xs text-muted-foreground hidden sm:inline-block">
                            Press <kbd className="font-mono bg-muted px-1 rounded">Enter</kbd> to capture
                        </span>
                        <div className="flex items-center gap-2 ml-auto">
                            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={!text.trim() || isSubmitting} size="sm">
                                {isSubmitting ? "Capturing..." : (
                                    <>
                                        Capture <ArrowRight className="ml-1 w-4 h-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
