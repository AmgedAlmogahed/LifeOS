"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Project, Task, ProjectAsset, MeetingMinutes, Invoice } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { convertOutcomeToTask } from "@/lib/actions/meetings";
import { uploadFile } from "@/lib/storage";
import { createProjectAsset } from "@/lib/actions/assets";
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
  DollarSign,
  Calendar,
  CheckSquare,
  Upload,
  Loader2,
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
  minutes: MeetingMinutes[];
  invoices: Invoice[];
}

export function ProjectForge({ project, tasks, assets, minutes, invoices }: ProjectForgeProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [freezing, setFreezing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"specs" | "minutes" | "billing">("specs");

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

  const handleConvertOutcome = async (outcome: string) => {
      if(!confirm(`Create task for: "${outcome}"?`)) return;
      try {
          await convertOutcomeToTask(outcome, project.id);
          alert("Task created!");
          router.refresh();
      } catch(e) {
          alert("Error creating task");
          console.error(e);
      }
  };

  const handleUploadClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      
      try {
          setUploading(true);
          const url = await uploadFile("projects", file);
          await createProjectAsset(project.id, url, file.name, "docs");
          router.refresh();
      } catch (err) {
          console.error(err);
          alert("Upload failed.");
      } finally {
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
      }
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

      {/* ═══ TABS NAVIGATION ═══════════════════════════════════════════ */}
      <div className="border-b border-border px-6 flex items-center gap-6 bg-card/10 shrink-0">
            <button onClick={() => setActiveTab("specs")} className={cn("py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2", activeTab === "specs" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
                <FileText className="w-4 h-4" /> Specs
            </button>
            <button onClick={() => setActiveTab("minutes")} className={cn("py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2", activeTab === "minutes" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
                <Calendar className="w-4 h-4" /> Minutes
            </button>
            <button onClick={() => setActiveTab("billing")} className={cn("py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2", activeTab === "billing" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
                <DollarSign className="w-4 h-4" /> Billing
            </button>
      </div>

      {/* ═══ CONTENT SPLIT ═════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden">
        {/* ─── LEFT: CONTENT TABS ─────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 border-r border-border">
          
          {activeTab === "specs" && (
              <>
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
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <ExternalLink className="w-4 h-4 text-primary" />
                            Asset Repository
                        </h2>
                        <div className="flex gap-2">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                className="hidden" 
                            />
                            <button 
                                onClick={handleUploadClick}
                                disabled={uploading}
                                className="text-xs flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                            >
                                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                Upload
                            </button>
                        </div>
                    </div>

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
              </>
          )}

          {activeTab === "minutes" && (
              <div className="space-y-4">
                  <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold">Meeting Minutes</h2>
                      {/* Add button here if we had a modal, but for now just list */}
                  </div>
                  {minutes.length === 0 ? <div className="text-muted-foreground text-sm italic glass-card p-6 text-center">No meeting minutes recorded.</div> : 
                  minutes.map(m => (
                      <div key={m.id} className="glass-card p-5">
                          <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-foreground">{m.title}</h3>
                              <span className="text-xs text-muted-foreground">{formatDate(m.date)}</span>
                          </div>
                          <div className="text-sm text-foreground/80 mb-3 whitespace-pre-wrap">{m.summary_md}</div>
                          {m.outcomes_md && (
                              <div className="mt-4 border-t border-border pt-3">
                                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Outcomes / Action Items</h4>
                                  <ul className="space-y-2">
                                      {m.outcomes_md.split('\n').filter(l => l.trim().startsWith('-')).map((line, idx) => {
                                          const outcomeText = line.replace(/^-\s*/, '');
                                          const isLink = false; // logic check if outcome already linked? Too complex for MVP
                                          return (
                                              <li key={idx} className="flex items-start gap-2 text-sm group">
                                                  <button onClick={() => handleConvertOutcome(outcomeText)} title="Convert to Task" className="mt-0.5 text-muted-foreground hover:text-primary transition-colors">
                                                      <CheckSquare className="w-4 h-4" />
                                                  </button>
                                                  <span className="text-foreground/90">{outcomeText}</span>
                                              </li>
                                          )
                                      })}
                                  </ul>
                              </div>
                          )}
                      </div>
                  ))}
              </div>
          )}

          {activeTab === "billing" && (
              <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <h2 className="text-sm font-semibold">Invoices</h2>
                  </div>
                  <div className="glass-card overflow-hidden">
                      <table className="w-full text-sm caption-bottom">
                          <thead className="bg-muted/30 border-b border-border">
                              <tr>
                                  <th className="text-left p-3 font-medium text-muted-foreground">ID</th>
                                  <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                                  <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                              </tr>
                          </thead>
                          <tbody>
                              {invoices.length === 0 ? <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No invoices found for this project.</td></tr> :
                              invoices.map(inv => (
                                  <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                                      <td className="p-3 font-mono text-xs text-muted-foreground">{inv.id.slice(0,8)}</td>
                                      <td className="p-3 text-foreground">{formatDate(inv.created_at)}</td>
                                      <td className="p-3">
                                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", 
                                            inv.status === "Paid" ? "bg-emerald-500/10 text-emerald-500" :
                                            inv.status === "Pending" ? "bg-amber-500/10 text-amber-500" :
                                            inv.status === "Overdue" ? "bg-red-500/10 text-red-500" :
                                            "bg-muted text-muted-foreground"
                                        )}>{inv.status}</span>
                                      </td>
                                      <td className="p-3 text-right font-mono text-foreground">{formatCurrency(inv.amount)}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

        </div>

        {/* ─── RIGHT: Implementation Status ───────────────────────────── */}
        <div className="w-[420px] overflow-y-auto shrink-0 p-5 space-y-4 bg-card/5">
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
                          <InfoBlock label="Due" value={task.due_date ? formatDate(task.due_date) : "—"} />
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
