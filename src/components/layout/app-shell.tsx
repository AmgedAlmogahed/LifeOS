"use client";

import { usePathname } from "next/navigation";
import { ContextBar } from "./context-bar";
import { Sidebar } from "./sidebar";
import { QuickCaptureModal } from "@/components/features/quick-capture-modal";
import { QuickCaptureButton } from "@/components/features/quick-capture-button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function AppShell({ children, inboxCount = 0 }: { children: React.ReactNode, inboxCount?: number }) {
    const pathname = usePathname();
    const [isCaptureOpen, setIsCaptureOpen] = useState(false);
    // Sidebar is hidden by default — toggled via hamburger in ContextBar
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

    // Close sidebar when route changes
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
             {/* Context Bar — mode-aware top nav */}
             <ContextBar
                mode={mode}
                inboxCount={inboxCount}
                onCapture={() => setIsCaptureOpen(true)}
                onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
                isSidebarOpen={isSidebarOpen}
             />

             {/* Sidebar — hidden by default, slides in on toggle */}
             <Sidebar
                open={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                inboxCount={inboxCount}
             />

             {/* Scrim overlay when sidebar is open */}
             {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
                    onClick={() => setIsSidebarOpen(false)}
                />
             )}

             {/* Main Content Area */}
             <main className="flex-1 pt-14 relative overflow-y-auto overflow-x-hidden">
                {children}

                {/* Floating Action Button */}
                <div className="fixed bottom-6 right-6 z-30 md:hidden">
                    <QuickCaptureButton onClick={() => setIsCaptureOpen(true)} />
                </div>
             </main>

             {/* Global Capture Modal */}
             <QuickCaptureModal isOpen={isCaptureOpen} onClose={() => setIsCaptureOpen(false)} />
        </div>
    );
}
