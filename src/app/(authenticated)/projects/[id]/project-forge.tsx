"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Project, Task, ProjectAsset, MeetingMinutes, Invoice, Sprint, Milestone, ProjectWithAccount } from "@/types/database";
import type { ProjectStateContext as PSCType } from "@/types/database";
import type { ScopeNode } from "@/lib/actions/scope-nodes";
import type { AuthorityApplication } from "@/lib/actions/authority-applications";
import type { TaskDependency } from "@/lib/actions/task-dependencies";
import { TaskDetailSheet } from "@/components/features/tasks/TaskDetailSheet";
import { ProjectStateContext as ProjectStateContextWidget } from "@/components/features/projects/ProjectStateContext";
import { ScopeTree } from "@/components/features/scope/ScopeTree";
import { ContextDrawer } from "@/components/features/context-drawer/ContextDrawer";
import { GanttView } from "@/components/features/gantt/GanttView";
import { RoadmapBoard } from "@/components/features/sprints/RoadmapBoard";
import { updateProjectStatus } from "@/lib/actions/projects";
import { addTaskDependency } from "@/lib/actions/task-dependencies";
import { updateSprint } from "@/lib/actions/sprints";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/ui/back-button";
import {
  Lock, ArrowLeft, Circle, CheckCircle2, AlertCircle, Pause,
  ListChecks, BarChart2, Clock,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
} from "lucide-react";
import { CompanyBadge } from "@/components/ui/company-badge";

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

function normalizeStatus(status: string): LifecycleStage {
  const map: Record<string, LifecycleStage> = {
    Understand: "Planning", Document: "Planning", Freeze: "Planning",
    Implement: "Building", Verify: "Delivery",
  };
  return (LIFECYCLE_STAGES.includes(status as LifecycleStage) ? status : map[status] ?? "Planning") as LifecycleStage;
}

type ExecTab = "roadmap" | "gantt";

interface ProjectCanvasProps {
  project: ProjectWithAccount;
  tasks: Task[];
  assets: ProjectAsset[];
  minutes: MeetingMinutes[];
  invoices: Invoice[];
  sprints: Sprint[];
  milestones: Milestone[];
  scopeNodes: ScopeNode[];
  authorityApplications: AuthorityApplication[];
  resumeNote: string | null;
  taskDependencies: TaskDependency[];
  projectStateContext: PSCType | null;
  documents: any[];
  contextBundle: any;
}

export function ProjectCanvas({
  project, tasks, assets, minutes, invoices, sprints,
  milestones, scopeNodes, authorityApplications, resumeNote, taskDependencies,
  projectStateContext, documents, contextBundle
}: ProjectCanvasProps) {
  const router = useRouter();
  
  const isPersonal = !project.account_id && !project.client_id;
  
  const [freezing, setFreezing] = useState(false);
  const [selectedScopeId, setSelectedScopeId] = useState<string | null>(null);
  const [execTab, setExecTab] = useState<ExecTab>("roadmap");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [, startTransition] = useTransition();

  // ─── Column collapse state (persist to localStorage) ─────────────────────
  const [col1Open, setCol1Open] = useState(true);
  const [col3Open, setCol3Open] = useState(true);

  useEffect(() => {
    const c1 = localStorage.getItem(`forge-col1-${project.id}`);
    const c3 = localStorage.getItem(`forge-col3-${project.id}`);
    if (c1 === "false") setCol1Open(false);
    if (c3 === "false") setCol3Open(false);
  }, [project.id]);

  const toggleCol1 = () => {
    const next = !col1Open;
    setCol1Open(next);
    localStorage.setItem(`forge-col1-${project.id}`, String(next));
  };
  const toggleCol3 = () => {
    const next = !col3Open;
    setCol3Open(next);
    localStorage.setItem(`forge-col3-${project.id}`, String(next));
  };

  // ─── Locked task IDs ─────────────────────────────────────────────────────
  // A task is "locked" if it has a dependency and that dependency is not "Done"
  const lockedTaskIds = useMemo<Set<string>>(() => {
    // Build a map: task_id → depends_on_task_id[]
    const depMap = new Map<string, string[]>();
    taskDependencies.forEach(dep => {
      const existing = depMap.get(dep.task_id) ?? [];
      existing.push(dep.depends_on_task_id);
      depMap.set(dep.task_id, existing);
    });

    const doneIds = new Set(tasks.filter(t => t.status === "Done").map(t => t.id));
    const locked = new Set<string>();

    depMap.forEach((prereqIds, taskId) => {
      const hasUnmetDep = prereqIds.some(prereqId => !doneIds.has(prereqId));
      if (hasUnmetDep) locked.add(taskId);
    });

    return locked;
  }, [taskDependencies, tasks]);

  // ─── Filter tasks by scope node ───────────────────────────────────────────
  const getDescendantScopeIds = (parentId: string, allNodes: ScopeNode[]): string[] => {
    let ids = [parentId];
    const children = allNodes.filter(n => n.parent_id === parentId);
    for (const child of children) {
      ids = ids.concat(getDescendantScopeIds(child.id, allNodes));
    }
    return ids;
  };

  const allowedScopeIds = selectedScopeId
    ? getDescendantScopeIds(selectedScopeId, scopeNodes)
    : [];

  const filteredTasks = selectedScopeId
    ? tasks.filter((t) => {
        const tScope = (t as any).scope_node_id;
        return tScope && allowedScopeIds.includes(tScope);
      })
    : tasks;

  const completedTasks = filteredTasks.filter(t => t.status === "Done").length;
  const taskProgress = filteredTasks.length > 0
    ? Math.round((completedTasks / filteredTasks.length) * 100) : 0;

  // ─── Lifecycle stepper ────────────────────────────────────────────────────
  const currentStage = normalizeStatus(project.status);
  const currentIdx = LIFECYCLE_STAGES.indexOf(currentStage);

  const handleFreeze = async () => {
    if (project.is_frozen) return;
    if (!confirm("Freeze spec? This locks it by design.")) return;
    setFreezing(true);
    await updateProjectStatus(project.id, project.status);
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

  const handleGanttLink = (sourceId: string, targetId: string) => {
    startTransition(async () => {
      await addTaskDependency(targetId, sourceId, project.id);
    });
  };

  const handleGanttDateChange = (taskId: string, start: string, end: string) => {
    startTransition(async () => {
      const isSprint = sprints.some(s => s.id === taskId);
      if (isSprint) {
        await updateSprint(taskId, { started_at: start, planned_end_at: end } as any);
      } else {
        const { shiftTaskAndDependents } = await import("@/lib/actions/tasks");
        await shiftTaskAndDependents(taskId, start, end, project.id);
      }
      router.refresh();
    });
  };

  const handleCreateGanttTask = () => {
    startTransition(async () => {
      const { createTask } = await import("@/lib/actions/tasks");
      const newTask = await createTask({
        title: "New Task",
        project_id: project.id,
        status: "Todo",
        priority: "Medium",
        start_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 86400000).toISOString(),
      } as any);
      if (newTask) {
        setSelectedTask(newTask as Task);
        router.refresh();
      }
    });
  };

  const handleCreateTask = (sprintId: string | null) => {
    startTransition(async () => {
      const { createTask } = await import("@/lib/actions/tasks");
      const newTask = await createTask({
        title: "New Task",
        project_id: project.id,
        status: "Todo",
        priority: "Medium",
        ...(sprintId ? { sprint_id: sprintId } : {}),
      } as any);
      if (newTask) {
        setSelectedTask(newTask as Task);
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ═══ HEADER ══════════════════════════════════════════════════════════ */}
      <div className="h-14 border-b border-border flex items-center px-4 bg-card/50 backdrop-blur-sm shrink-0 gap-3">
        <BackButton fallbackHref="/projects" variant="ghost" size="icon" label="" className="h-8 w-8" />

        {/* Col 1 toggle */}
        <button
          onClick={toggleCol1}
          title={col1Open ? "Hide Scope Tree" : "Show Scope Tree"}
          className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          {col1Open ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>

        <h1 className="text-sm font-semibold text-foreground truncate">{project.name}</h1>
        
        <CompanyBadge account={project.accounts} size="sm" />
        
        {project.clients?.name && (
          <div className="px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider bg-blue-400/10 border-blue-400/20 text-blue-400 shrink-0">
            {project.clients.name}
          </div>
        )}

        {project.is_frozen && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-sky-400 bg-sky-400/10 border border-sky-400/20 px-2 py-0.5 rounded-md shrink-0">
            <Lock className="w-3 h-3" /> Frozen
          </span>
        )}

        {resumeNote && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 max-w-xs shrink-0">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="text-[10px] font-medium truncate">
              ↩ {resumeNote.slice(0, 70)}{resumeNote.length > 70 ? "…" : ""}
            </span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2 shrink-0">
          {/* Col 3 toggle */}
          <button
            onClick={toggleCol3}
            title={col3Open ? "Hide Context Drawer" : "Show Context Drawer"}
            className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            {col3Open ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>

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
        <aside className={cn(
          "shrink-0 border-r border-border overflow-y-auto bg-card/5 transition-all duration-300",
          col1Open ? "w-52" : "w-0 overflow-hidden border-r-0"
        )}>
          <ScopeTree
            projectId={project.id}
            nodes={scopeNodes}
            selectedId={selectedScopeId}
            onSelect={setSelectedScopeId}
          />
        </aside>

        {/* ── Column 2: Execution Engine ── */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">

          <div className="flex items-center gap-4 px-4 py-2 border-b border-border shrink-0 bg-card/10 z-10">
            {(["roadmap", "gantt"] as ExecTab[]).map((tab) => (
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
                {tab === "roadmap" && <Clock className="w-3.5 h-3.5" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              {selectedScopeId && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  Filtered
                </span>
              )}
              {lockedTaskIds.size > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-medium">
                  <Lock className="w-3 h-3" />
                  {lockedTaskIds.size} locked
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
            {execTab === "roadmap" && (
              <RoadmapBoard
                project={project}
                sprints={sprints}
                tasks={filteredTasks}
                activeScopeId={selectedScopeId}
                onTaskClick={setSelectedTask}
                lockedTaskIds={lockedTaskIds}
                scopeNodes={scopeNodes}
                onCreateTask={handleCreateTask}
              />
            )}

            {execTab === "gantt" && (
              <GanttView
                tasks={filteredTasks}
                sprints={sprints}
                scopeNodes={scopeNodes}
                onTaskClick={(task) => {
                  if (task.id === "NEW_FROM_GANTT") {
                    handleCreateGanttTask();
                  } else {
                    setSelectedTask(task);
                  }
                }}
                onLink={handleGanttLink}
                onDateChange={handleGanttDateChange}
              />
            )}
          </div>
        </main>

        {/* ── Column 3: Context Drawer ── */}
        <aside className={cn(
          "shrink-0 overflow-hidden transition-all duration-300 border-l border-border",
          col3Open ? "w-96" : "w-0 border-l-0"
        )}>
          <div className="overflow-y-auto h-full">
            {/* Project State Context widget */}
            <div className="p-3 border-b border-border">
              <ProjectStateContextWidget
                context={projectStateContext}
                projectId={project.id}
              />
            </div>
            <ContextDrawer
              projectId={project.id}
              projectBudget={(project as any).budget ?? 0}
              assets={assets}
              invoices={isPersonal ? [] : invoices} /* Adaptive UI: hide finance for personal */
              milestones={milestones}
              authorityApplications={authorityApplications}
              scopeNodes={scopeNodes}
              isPersonal={isPersonal}
              documents={documents}
              contextBundle={contextBundle}
            />
          </div>
        </aside>
      </div>

      {/* Task Detail Sheet */}
      {selectedTask && (
        <TaskDetailSheet
          task={selectedTask}
          open={true}
          onOpenChange={(open) => { if (!open) setSelectedTask(null); }}
          scopeNodes={scopeNodes}
          allTasks={tasks}
        />
      )}
    </div>
  );
}
