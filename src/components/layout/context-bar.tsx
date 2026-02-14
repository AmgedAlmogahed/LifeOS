"use client";

import { usePathname, useRouter } from "next/navigation";
import { Moon, Inbox, Plus, ArrowLeft, Home, Zap, CalendarCheck, ListTodo, CalendarDays, Menu, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ContextBarProps {
  mode: 'cockpit' | 'focus' | 'plan';
  projectName?: string;
  clientName?: string;
  inboxCount?: number;
  onCapture?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function ContextBar({ mode, projectName, clientName, inboxCount = 0, onCapture, onToggleSidebar, isSidebarOpen }: ContextBarProps) {
    const router = useRouter();

    return (
        <header className="fixed top-0 left-0 right-0 h-14 bg-background/80 backdrop-blur-md border-b border-border z-40 flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
                {/* Hamburger toggle */}
                <button
                    onClick={onToggleSidebar}
                    className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
                    aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                >
                    {isSidebarOpen ? (
                        <X className="w-5 h-5 text-muted-foreground" />
                    ) : (
                        <Menu className="w-5 h-5 text-muted-foreground" />
                    )}
                </button>

                {mode === 'cockpit' ? (
                    <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
                        <Zap className="w-5 h-5 text-primary fill-primary/20" />
                        <span>LifeOS</span>
                    </div>
                ) : (
                    <Link href="/cockpit" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Cockpit</span>
                    </Link>
                )}

                {mode === 'focus' && (
                    <div className="h-4 w-[1px] bg-border mx-2" />
                )}

                {mode === 'focus' && (
                    <div className="flex flex-col justify-center">
                        <h1 className="text-sm font-semibold leading-none">{projectName}</h1>
                        <span className="text-[10px] text-muted-foreground leading-none mt-1">{clientName}</span>
                    </div>
                )}

                {mode === 'plan' && (
                    <>
                        <div className="h-4 w-[1px] bg-border mx-2" />
                        <div className="flex items-center gap-2">
                             <Moon className="w-4 h-4 text-indigo-400 fill-indigo-400/20" />
                             <span className="text-sm font-semibold">Evening Plan</span>
                        </div>
                    </>
                )}
            </div>

            <div className="flex items-center gap-2">
                {/* Navigation Links (only in Cockpit) */}
                {mode === 'cockpit' && (
                    <>
                        <Link href="/tasks" className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent text-sm font-medium transition-colors">
                            <ListTodo className="w-4 h-4" />
                            <span className="hidden sm:inline">Tasks</span>
                        </Link>
                        <Link href="/calendar" className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent text-sm font-medium transition-colors">
                            <CalendarDays className="w-4 h-4" />
                            <span className="hidden sm:inline">Calendar</span>
                        </Link>
                        <Link href="/plan" className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent text-sm font-medium transition-colors">
                            {new Date().getHours() >= 18 ? (
                                <Moon className="w-4 h-4 text-indigo-400" />
                            ) : (
                                <CalendarCheck className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">Plan</span>
                        </Link>
                    </>
                )}

                {/* Inbox Link */}
                <div className="relative">
                    <Link href="/inbox" className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent text-sm font-medium transition-colors">
                        <Inbox className="w-4 h-4" />
                        <span className="hidden sm:inline">{inboxCount}</span>
                    </Link>
                    {inboxCount > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse md:hidden" />
                    )}
                </div>

                {/* Quick Capture Button */}
                <button
                    onClick={onCapture}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors ml-2"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Capture</span>
                </button>
            </div>
        </header>
    );
}
