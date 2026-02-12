"use client";

import { usePathname, useParams } from "next/navigation";
import { ContextBar } from "./context-bar";
import { QuickCaptureModal } from "@/components/features/quick-capture-modal";
import { QuickCaptureButton } from "@/components/features/quick-capture-button";
import { useState, useEffect } from "react";

export function AppShell({ children, inboxCount = 0 }: { children: React.ReactNode, inboxCount?: number }) {
    const pathname = usePathname();
    // const params = useParams(); // May use later for project extraction
    const [isCaptureOpen, setIsCaptureOpen] = useState(false);

    // Determine mode based on route
    let mode: 'cockpit' | 'focus' | 'plan' = 'cockpit';
    if (pathname?.startsWith('/focus')) {
        mode = 'focus';
    } else if (pathname?.startsWith('/plan')) {
        mode = 'plan';
    }
    
    // Cmd+K Shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsCaptureOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
             {/* Context Bar (Top Navigation) */}
             <ContextBar 
                mode={mode} 
                inboxCount={inboxCount}
                onCapture={() => setIsCaptureOpen(true)}
                // Dynamic titles can be passed if we lift state or fetch here.
                // For now, Focus page might set title document via useEffect or separate header?
                // Or ContextBar handles it internally.
             />
             
             {/* Main Content Area */}
             <main className="flex-1 pt-14 relative overflow-y-auto overflow-x-hidden">
                {children}
                
                {/* Floating Action Button */}
                <div className="fixed bottom-6 right-6 z-50 md:hidden">
                    <QuickCaptureButton onClick={() => setIsCaptureOpen(true)} />
                </div>
             </main>
             
             {/* Global Capture Modal */}
             <QuickCaptureModal isOpen={isCaptureOpen} onClose={() => setIsCaptureOpen(false)} />
        </div>
    );
}
