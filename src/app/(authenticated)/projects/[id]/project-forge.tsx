"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project, Task, ProjectAsset } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import {
  Lock,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ArrowLeft,
  FileText,
  CheckCircle2,
  Circle,
  AlertCircle,
  Pause,
  Github,
  Figma,
  Database,
  FileQuestion,
  Bot,
  ListChecks,
} from "lucide-react";
import Link from "next/link";

// ─── Phase Config ────────────────────────────────────────────────────────────

const phases = ["Understand", "Document", "Freeze", "Implement", "Verify"] as const;
const phaseColors: Record<string, { css: string; bg: string; border: string }> = {
  Understand: { css: "phase-understand", bg: "phase-bg-understand", border: "phase-border-understand" },
  Document:   { css: "phase-document",   bg: "phase-bg-document",   border: "phase-border-document" },
  Freeze:     { css: "phase-freeze",     bg: "phase-bg-freeze",     border: "phase-border-freeze" },
  Implement:  { css: "phase-implement",  bg: "phase-bg-implement",  border: "phase-border-implement" },
  Verify:     { css: "phase-verify",     bg: "phase-bg-verify",     border: "phase-border-verify" },
};

const taskStatusIcon: Record<string, React.ReactNode> = {
  Todo: <Circle className="w-3.5 h-3.5 text-muted-foreground" />,
  "In Progress": <AlertCircle className="w-3.5 h-3.5 text-amber-500" />,
  Done: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
  Blocked: <Pause className="w-3.5 h-3.5 text-red-500" />,
};

const assetIcons: Record<string, React.ReactNode> = {
  github: <Github className="w-4 h-4" />,
  figma: <Figma className="w-4 h-4" />,
  supabase: <Database className="w-4 h-4" />,
  docs: <FileText className="w-4 h-4" />,
  other: <FileQuestion className="w-4 h-4" />,
};

interface ProjectForgeProps {
  project: Project;
  tasks: Task[];
  assets: ProjectAsset[];
}

export function ProjectForge({ project, tasks, assets }: ProjectForgeProps) {
  const router = useRouter();
  const supabase = createClient();
  const [freezing, setFreezing] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const currentPhaseIdx = phases.indexOf(project.status as (typeof phases)[number]);
  const completedTasks = tasks.filter((t) => t.status === "Done").length;
  const taskProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const handleFreeze = async () => {
    if (project.is_frozen) return;
    if (!confirm("Freezing will lock the spec. This action is high-friction by design. Continue?")) return;
    setFreezing(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("projects") as any)
      .update({ is_frozen: true, status: "Freeze" })
      .eq("id", project.id);
    router.refresh();
    setFreezing(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* ═══ HEADER ════════════════════════════════════════════════════ */}
      <div className="h-14 border-b border-border flex items-center px-6 bg-card/50 backdrop-blur-sm shrink-0">
        <Link href="/projects" className="mr-4 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-base font-semibold text-foreground">{project.name}</h1>

        {project.is_frozen && (
          <span className="ml-3 flex items-center gap-1.5 text-xs font-medium phase-freeze phase-bg-freeze px-2.5 py-1 rounded-md border phase-border-freeze">
            <Lock className="w-3 h-3" /> Frozen
          </span>
        )}

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={handleFreeze}
            disabled={project.is_frozen || freezing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              project.is_frozen
                ? "bg-accent text-muted-foreground cursor-not-allowed"
                : "btn-gradient cursor-pointer"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            {project.is_frozen ? "Frozen" : freezing ? "Freezing..." : "Freeze Spec"}
          </button>
        </div>
      </div>

      {/* ═══ PHASE PIPELINE ════════════════════════════════════════════ */}
      <div className="border-b border-border px-6 py-3 flex items-center gap-1 bg-card/20">
        {phases.map((phase, i) => {
          const isCurrent = i === currentPhaseIdx;
          const isPast = i < currentPhaseIdx;
          const colors = phaseColors[phase];

          return (
            <div key={phase} className="flex items-center gap-1 flex-1">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isCurrent ? `${colors.bg} ${colors.css} border ${colors.border}` :
                isPast ? "text-muted-foreground/60 line-through" :
                "text-muted-foreground/40"
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isCurrent ? colors.bg : isPast ? "bg-muted-foreground/20" : "bg-accent"
                } border ${isCurrent ? colors.border : "border-transparent"}`} />
                {phase}
              </div>
              {i < phases.length - 1 && (
                <div className={`flex-1 h-px mx-1 ${isPast ? "bg-muted-foreground/30" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ═══ CONTENT SPLIT ═════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden">
        {/* ─── LEFT: Architecture & Specs ─────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 border-r border-border">
          {/* Specs */}
          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-primary" />
              Architecture & Specs
            </h2>
            <div className="glass-card p-5">
              {project.specs_md ? (
                <pre className="data-mono text-foreground/80 whitespace-pre-wrap">{project.specs_md}</pre>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No specs documented yet. Add project specifications to track architecture decisions.
                </p>
              )}
            </div>
          </div>

          {/* Asset Repository */}
          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <ExternalLink className="w-4 h-4 text-primary" />
              Asset Repository
            </h2>
            {assets.length === 0 ? (
              <div className="glass-card p-5 text-center">
                <p className="text-sm text-muted-foreground">No linked assets.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {assets.map((asset) => (
                  <a
                    key={asset.id}
                    href={asset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-card p-3.5 flex items-center gap-3 group"
                  >
                    <div className="text-muted-foreground group-hover:text-primary transition-colors">
                      {assetIcons[asset.asset_type] ?? assetIcons.other}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{asset.label}</div>
                      <div className="text-[11px] text-muted-foreground/50 truncate">{asset.url}</div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary/60 transition-colors" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT: Implementation Status ───────────────────────────── */}
        <div className="w-[420px] overflow-y-auto shrink-0 p-5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground">Implementation</h2>
            <span className="text-xs text-muted-foreground">
              {completedTasks}/{tasks.length} tasks · {taskProgress}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 bg-accent rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/60 transition-all duration-500"
              style={{ width: `${taskProgress}%` }}
            />
          </div>

          {/* Task List */}
          {tasks.length === 0 ? (
            <div className="glass-card p-6 text-center">
              <ListChecks className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No tasks yet.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {tasks.map((task) => {
                const isExpanded = expandedTask === task.id;
                return (
                  <div key={task.id} className="glass-card overflow-hidden">
                    <button
                      onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                      className="w-full p-3 flex items-center gap-3 text-left"
                    >
                      {taskStatusIcon[task.status]}
                      <span className="text-sm text-foreground truncate flex-1">{task.title}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                        task.priority === "Critical" ? "level-critical level-bg-critical border-red-500/20" :
                        task.priority === "High" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                        task.priority === "Medium" ? "text-primary bg-primary/10 border-primary/20" :
                        "text-muted-foreground bg-accent border-border"
                      }`}>
                        {task.priority}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 border-t border-border/50">
                        <div className="mt-3 grid grid-cols-3 gap-2.5">
                          <InfoBlock label="Priority" value={task.priority} />
                          <InfoBlock label="Type" value={task.type} />
                          <InfoBlock label="Due" value={task.due_date ?? "—"} />
                        </div>

                        {task.agent_context && Object.keys(task.agent_context).length > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Bot className="w-3 h-3 text-muted-foreground" />
                              <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                                Agent Context
                              </span>
                            </div>
                            <pre className="data-mono text-foreground/70 bg-background rounded-lg p-3 overflow-x-auto border border-border/50 text-[11px]">
                              {JSON.stringify(task.agent_context, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card p-2.5">
      <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{label}</div>
      <div className="text-xs text-foreground mt-0.5">{value}</div>
    </div>
  );
}
