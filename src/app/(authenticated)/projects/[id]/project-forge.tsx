"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Project, Task, ProjectAsset, MeetingMinutes, Invoice, Sprint, Milestone } from "@/types/database";
import type { ScopeNode } from "@/lib/actions/scope-nodes";
import type { AuthorityApplication } from "@/lib/actions/authority-applications";
import { SprintControl } from "@/components/features/sprints/SprintControl";
import { TaskDetailSheet } from "@/components/features/tasks/TaskDetailSheet";
import { ScopeTree } from "@/components/features/scope/ScopeTree";
import { ContextDrawer } from "@/components/features/context-drawer/ContextDrawer";
import { GanttView } from "@/components/features/gantt/GanttView";
import { updateProjectStatus } from "@/lib/actions/projects";
import { addTaskDependency } from "@/lib/actions/task-dependencies";
import { cn, formatDate } from "@/lib/utils";
import {
  Lock, ArrowLeft, Circle, CheckCircle2, AlertCircle, Pause,
  ListChecks, BarChart2, Clock,
} from "lucide-react";
import Link from "next/link";

// ─── Consultancy Lifecycle ────────────────────────────────────────────────────
const LIFECYCLE_STAGES = ["Lead", "Proposal", "Planning", "Building", "Deploy", "Delivery"] as const;
type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

const STAGE_COLORS: Record<LifecycleStage, { text: string; bg: string; border: string }> = {
  Lead:     { text: "text-indigo-400",  bg: "bg-indigo-400/10",  border: "border-indigo-400/30" },
  Proposal: { text: "text-violet-400",  bg: "bg-violet-400/10",  border: "border-violet-400/30" },
  Planning: { text: "text-sky-400",     bg: "bg-sky-400/10",     border: "border-sky-400/30" },
  Building: { text: "text-amber-400",   bg: "bg-amber-400/10",   border: "border-amber-400/30" },
  Deploy:   { text: "text-orange-400",  bg: "bg-orange-400/10",  border: "border-orange-400/30" },
  Delivery: { text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30" },
};

/** Map old enum values to new ones for display */
function normalizeStatus(status: string): LifecycleStage {
  const map: Record<string, LifecycleStage> = {
    Understand: "Planning", Document: "Planning", Freeze: "Planning",
    Implement: "Building", Verify: "Delivery",
  };
  return (LIFECYCLE_STAGES.includes(status as LifecycleStage) ? status : map[status] ?? "Planning") as LifecycleStage;
}

const TASK_STATUS_ICON: Record<string, React.ReactNode> = {
  Todo:        <Circle className="w-3.5 h-3.5 text-muted-foreground" />,
  "In Progress":<AlertCircle className="w-3.5 h-3.5 text-amber-500" />,
  Done:        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
  Blocked:     <Pause className="w-3.5 h-3.5 text-red-500" />,
};

type ExecTab = "sprint" | "backlog" | "gantt";

interface ProjectCanvasProps {
  project: Project;
  tasks: Task[];
  assets: ProjectAsset[];
  minutes: MeetingMinutes[];
  invoices: Invoice[];
  activeSprint: Sprint | null;
  milestones: Milestone[];
  scopeNodes: ScopeNode[];
  authorityApplications: AuthorityApplication[];
  resumeNote: string | null;
}

export function ProjectCanvas({
  project, tasks, assets, minutes, invoices, activeSprint,
  milestones, scopeNodes, authorityApplications, resumeNote,
}: ProjectCanvasProps) {
  const router = useRouter();

  const [freezing, setFreezing] = useState(false);
  const [selectedScopeId, setSelectedScopeId] = useState<string | null>(null);
  const [execTab, setExecTab] = useState<ExecTab>("sprint");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [, startTransition] = useTransition();

  // ─── Filter tasks by scope node ──────────────────────────────────────────
  const filteredTasks = selectedScopeId
    ? tasks.filter((t) => (t as any).scope_node_id === selectedScopeId)
    : tasks;

  const completedTasks = filteredTasks.filter((t) => t.status === "Done").length;
  const taskProgress = filteredTasks.length > 0
    ? Math.round((completedTasks / filteredTasks.length) * 100) : 0;

  // ─── Lifecycle stepper ───────────────────────────────────────────────────
  const currentStage = normalizeStatus(project.status);
  const currentIdx = LIFECYCLE_STAGES.indexOf(currentStage);

  const handleFreeze = async () => {
    if (project.is_frozen) return;
    if (!confirm("Freeze spec? This locks it by design.")) return;
    setFreezing(true);
    await updateProjectStatus(project.id, project.status); // writes is_frozen separately
    router.refresh();
    setFreezing(false);
  };

  const handleStageClick = (stage: LifecycleStage) => {
    if (project.is_frozen) return;
    startTransition(async () => {
      await updateProjectStatus(project.id, stage);
      router.refresh();
    });
  };

  /** Wire Gantt dependency link → task_dependencies table */
  const handleGanttLink = (sourceId: string, targetId: string) => {
    startTransition(async () => {
      await addTaskDependency(targetId, sourceId, project.id);
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ═══ HEADER ══════════════════════════════════════════════════════════ */}
      <div className="h-14 border-b border-border flex items-center px-4 bg-card/50 backdrop-blur-sm shrink-0 gap-3">
        <Link href="/projects" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <h1 className="text-sm font-semibold text-foreground truncate">{project.name}</h1>

        {project.is_frozen && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-sky-400 bg-sky-400/10 border border-sky-400/20 px-2 py-0.5 rounded-md shrink-0">
            <Lock className="w-3 h-3" /> Frozen
          </span>
        )}

        {/* Resume note chip */}
        {resumeNote && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 max-w-xs shrink-0">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="text-[10px] font-medium truncate">
              ↩ {resumeNote.slice(0, 70)}{resumeNote.length > 70 ? "…" : ""}
            </span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <button
            onClick={handleFreeze}
            disabled={project.is_frozen || freezing}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              project.is_frozen
                ? "bg-accent text-muted-foreground cursor-not-allowed opacity-60"
                : "btn-gradient cursor-pointer"
            )}
          >
            <Lock className="w-3 h-3" />
            {project.is_frozen ? "Frozen" : freezing ? "Freezing…" : "Freeze Spec"}
          </button>
        </div>
      </div>

      {/* ═══ LIFECYCLE STEPPER ═══════════════════════════════════════════════ */}
      <div className="border-b border-border px-4 py-2 flex items-center gap-0.5 bg-card/10 shrink-0 overflow-x-auto">
        {LIFECYCLE_STAGES.map((stage, i) => {
          const isCurrent = i === currentIdx;
          const isPast = i < currentIdx;
          const c = STAGE_COLORS[stage];
          return (
            <div key={stage} className="flex items-center gap-0.5 flex-1 min-w-0">
              <button
                onClick={() => handleStageClick(stage)}
                disabled={project.is_frozen}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap w-full justify-center",
                  isCurrent
                    ? `${c.text} ${c.bg} border ${c.border}`
                    : isPast
                    ? "text-muted-foreground/50 line-through"
                    : "text-muted-foreground/30 hover:text-muted-foreground/60"
                )}
              >
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  isCurrent ? c.bg + " border " + c.border : "bg-muted-foreground/20"
                )} />
                {stage}
              </button>
              {i < LIFECYCLE_STAGES.length - 1 && (
                <div className={cn("h-px flex-1 mx-0.5 shrink-0", isPast ? "bg-muted-foreground/20" : "bg-border/50")} />
              )}
            </div>
          );
        })}
      </div>

      {/* ═══ 3-COLUMN BODY ═══════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Column 1: Scope Tree ── */}
        <aside className="w-52 shrink-0 border-r border-border overflow-y-auto bg-card/5">
          <ScopeTree
            projectId={project.id}
            nodes={scopeNodes}
            selectedId={selectedScopeId}
            onSelect={setSelectedScopeId}
          />
        </aside>

        {/* ── Column 2: Execution Engine ── */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* Exec tab strip */}
          <div className="flex items-center gap-4 px-4 py-2 border-b border-border shrink-0 bg-card/10">
            {(["sprint", "backlog", "gantt"] as ExecTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setExecTab(tab)}
                className={cn(
                  "flex items-center gap-1.5 py-1.5 text-xs font-semibold border-b-2 capitalize transition-colors",
                  execTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === "gantt" && <BarChart2 className="w-3.5 h-3.5" />}
                {tab === "sprint" && <Clock className="w-3.5 h-3.5" />}
                {tab === "backlog" && <ListChecks className="w-3.5 h-3.5" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              {selectedScopeId && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  Filtered
                </span>
              )}
              <span>
                {completedTasks}/{filteredTasks.length} done · {taskProgress}%
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-0.5 bg-accent/30 shrink-0">
            <div
              className="h-full bg-primary/60 transition-all duration-500"
              style={{ width: `${taskProgress}%` }}
            />
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {execTab === "sprint" && (
              <div className="p-4">
                <SprintControl project={project} activeSprint={activeSprint} tasks={filteredTasks} />
              </div>
            )}

            {execTab === "backlog" && (
              <div className="p-4 space-y-1.5">
                {filteredTasks.length === 0 ? (
                  <div className="py-12 flex flex-col items-center text-center">
                    <ListChecks className="w-10 h-10 text-muted-foreground/20 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {selectedScopeId ? "No tasks in this scope node." : "No tasks yet."}
                    </p>
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="w-full glass-card p-3 flex items-center gap-3 text-left hover:border-primary/30 transition-colors"
                    >
                      {TASK_STATUS_ICON[task.status] ?? TASK_STATUS_ICON.Todo}
                      <span className="flex-1 text-sm text-foreground truncate">{task.title}</span>
                      <span className={cn(
                        "text-[10px] font-medium px-2 py-0.5 rounded-md border shrink-0",
                        task.priority === "Critical" ? "text-red-400 bg-red-500/10 border-red-500/20" :
                        task.priority === "High"     ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                        task.priority === "Medium"   ? "text-primary bg-primary/10 border-primary/20" :
                        "text-muted-foreground bg-accent border-border"
                      )}>
                        {task.priority}
                      </span>
                      {task.due_date && (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatDate(task.due_date)}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            {execTab === "gantt" && (
              <GanttView tasks={filteredTasks} onTaskClick={setSelectedTask} onLink={handleGanttLink} />
            )}
          </div>
        </main>

        {/* ── Column 3: Context Drawer ── */}
        <aside className="w-96 shrink-0 overflow-hidden">
          <ContextDrawer
            projectId={project.id}
            projectBudget={(project as any).budget ?? 0}
            assets={assets}
            invoices={invoices}
            milestones={milestones}
            authorityApplications={authorityApplications}
            scopeNodes={scopeNodes}
          />
        </aside>
      </div>

      {/* Task Detail Sheet */}
      {selectedTask && (
        <TaskDetailSheet
          task={selectedTask}
          open={true}
          onOpenChange={(open) => { if (!open) setSelectedTask(null); }}
          scopeNodes={scopeNodes}
        />
      )}
    </div>
  );
}
