"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickCaptureButtonProps {
    onClick: () => void;
}

export function QuickCaptureButton({ onClick }: QuickCaptureButtonProps) {
    return (
        <Button 
            onClick={onClick}
            variant="default" 
            size="icon" 
            className="h-12 w-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105"
            aria-label="Quick Capture"
        >
            <Plus className="w-6 h-6" />
        </Button>
    );
}
