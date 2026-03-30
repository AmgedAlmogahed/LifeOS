"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Pause, Play, StopCircle, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FocusTimerProps {
    sessionId: string;
    taskTitle: string;
    estimatedMinutes: number | null;
    startedAt: string; // ISO string — the session start time for persistence
    onSessionEnd: () => void;
}

export function FocusTimer({ sessionId, taskTitle, estimatedMinutes, startedAt, onSessionEnd }: FocusTimerProps) {
    const [isPaused, setIsPaused] = useState(false);
    const [pausedElapsed, setPausedElapsed] = useState(0); // seconds accumulated while paused

    // Calculate elapsed from persisted start time
    const getElapsedSeconds = useCallback(() => {
        const start = new Date(startedAt).getTime();
        const now = Date.now();
        return Math.floor((now - start) / 1000) - pausedElapsed;
    }, [startedAt, pausedElapsed]);

    const [elapsed, setElapsed] = useState(getElapsedSeconds);

    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(() => {
            setElapsed(getElapsedSeconds());
        }, 1000);
        return () => clearInterval(interval);
    }, [isPaused, getElapsedSeconds]);

    // Pause tracking
    const pauseStartRef = useState<number | null>(null);

    const handlePause = () => {
        if (isPaused) {
            // Resume — add paused duration
            if (pauseStartRef[0] !== null) {
                const pausedDelta = Math.floor((Date.now() - pauseStartRef[0]) / 1000);
                setPausedElapsed(prev => prev + pausedDelta);
            }
            pauseStartRef[1](null);
        } else {
            // Pause
            pauseStartRef[1](Date.now());
        }
        setIsPaused(!isPaused);
    };

    // Format time
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    // Progress ring calculations (when estimated time is set)
    const progress = estimatedMinutes ? Math.min(elapsed / (estimatedMinutes * 60), 1) : 0;
    const remainingMinutes = estimatedMinutes ? Math.max(0, estimatedMinutes - Math.floor(elapsed / 60)) : null;
    const isOvertime = estimatedMinutes ? elapsed > estimatedMinutes * 60 : false;

    // SVG ring properties
    const ringSize = 200;
    const strokeWidth = 8;
    const radius = (ringSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <div className="flex flex-col items-center gap-6 py-8">
            {/* Task title */}
            <div className="text-center space-y-1">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Deep Focus</span>
                <h3 className="text-lg font-bold max-w-md truncate">{taskTitle}</h3>
            </div>

            {/* Timer display */}
            <div className="relative">
                {estimatedMinutes ? (
                    /* Progress ring mode */
                    <div className="relative" style={{ width: ringSize, height: ringSize }}>
                        <svg width={ringSize} height={ringSize} className="transform -rotate-90">
                            {/* Background ring */}
                            <circle
                                cx={ringSize / 2}
                                cy={ringSize / 2}
                                r={radius}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={strokeWidth}
                                className="text-muted/20"
                            />
                            {/* Progress ring */}
                            <motion.circle
                                cx={ringSize / 2}
                                cy={ringSize / 2}
                                r={radius}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                className={isOvertime ? "text-red-500" : "text-primary"}
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                            />
                        </svg>
                        {/* Time in center */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <motion.span
                                className={`font-mono text-4xl font-bold ${isOvertime ? "text-red-500" : "text-foreground"}`}
                                animate={!isPaused ? { scale: [1, 1.02, 1] } : {}}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                {timeStr}
                            </motion.span>
                            <span className="text-xs text-muted-foreground mt-1">
                                {isOvertime ? "overtime" : `${remainingMinutes}m remaining`}
                            </span>
                        </div>
                    </div>
                ) : (
                    /* Simple stopwatch mode */
                    <div className="flex flex-col items-center">
                        <motion.div
                            animate={!isPaused ? { scale: [1, 1.03, 1] } : {}}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="relative"
                        >
                            <div className="w-48 h-48 rounded-full border-4 border-primary/20 flex items-center justify-center bg-primary/5">
                                <span className="font-mono text-5xl font-bold text-foreground">
                                    {timeStr}
                                </span>
                            </div>
                            {/* Pulse effect */}
                            {!isPaused && (
                                <motion.div
                                    className="absolute inset-0 rounded-full border-2 border-primary/30"
                                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                />
                            )}
                        </motion.div>
                        <span className="text-xs text-muted-foreground mt-3">elapsed</span>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    size="lg"
                    onClick={handlePause}
                    className="gap-2"
                >
                    {isPaused ? (
                        <><Play className="w-4 h-4" /> Resume</>
                    ) : (
                        <><Pause className="w-4 h-4" /> Pause</>
                    )}
                </Button>
                <Button
                    size="lg"
                    variant="destructive"
                    onClick={onSessionEnd}
                    className="gap-2 shadow-lg"
                >
                    <StopCircle className="w-4 h-4" /> End Session
                </Button>
            </div>

            {/* Paused indicator */}
            {isPaused && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-amber-500 font-medium flex items-center gap-2"
                >
                    <Timer className="w-4 h-4" /> Timer paused
                </motion.div>
            )}
        </div>
    );
}
