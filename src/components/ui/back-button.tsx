"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  fallbackHref: string;
  className?: string;
  variant?: "ghost" | "outline" | "link" | "default";
  size?: "default" | "sm" | "lg" | "icon";
  label?: string;
}

export function BackButton({
  fallbackHref,
  className,
  variant = "ghost",
  size = "sm",
  label = "Back",
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // If we have history, go back to preserve state/filters
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      // Fallback if opened via direct link
      router.push(fallbackHref);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleBack}
      className={cn("gap-2 text-muted-foreground hover:text-foreground transition-colors shrink-0", className)}
    >
      <ArrowLeft className="w-4 h-4" />
      {label && <span className="text-xs font-medium">{label}</span>}
    </Button>
  );
}
