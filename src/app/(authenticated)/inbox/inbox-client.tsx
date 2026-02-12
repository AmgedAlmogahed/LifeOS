"use client";

import { useState } from "react";
import { Task } from "@/types/database";
import { 
  CheckCircle2, Circle, AlertCircle, Calendar, Tag, Briefcase, 
  User, Users, GraduationCap, LayoutGrid, CheckSquare, Pause
} from "lucide-react";
import { updateTask } from "@/lib/actions/tasks";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, isPast, parseISO } from "date-fns";

const taskStatusIcon: Record<string, React.ReactNode> = {
  Todo: <Circle className="w-4 h-4 text-muted-foreground" />,
  "In Progress": <AlertCircle className="w-4 h-4 text-amber-500" />,
  Done: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  Blocked: <Pause className="w-4 h-4 text-red-500" />,
};

const categoryIcon: Record<string, React.ReactNode> = {
  Business: <Briefcase className="w-3 h-3" />,
  Personal: <User className="w-3 h-3" />,
  Social: <Users className="w-3 h-3" />,
  Research: <GraduationCap className="w-3 h-3" />,
  Habit: <CheckSquare className="w-3 h-3" />,
};

type TaskWithProject = Task & { projects?: { id: string; name: string } | null };

const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export function InboxClient({ initialTasks }: { initialTasks: TaskWithProject[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "today" | "upcoming">("all");

  const sortedTasks = [...initialTasks].sort((a, b) => {
      // Sort by status (Done at bottom)
      if (a.status === "Done" && b.status !== "Done") return 1;
      if (a.status !== "Done" && b.status === "Done") return -1;
      
      // Sort by Priority
      const pA = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 99;
      const pB = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 99;
      if (pA !== pB) return pA - pB;
      
      // Sort by Date
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  const handleToggle = async (task: Task) => {
      const newStatus = task.status === "Done" ? "Todo" : "Done";
      try {
          // Optimistic update?
          // For simplicity, wait for server action revalidate
          await updateTask(task.id, { status: newStatus });
      } catch (e) {
          console.error(e);
          alert("Failed to update task");
      }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center px-6 shrink-0 bg-card/40 backdrop-blur-sm">
        <LayoutGrid className="w-4 h-4 mr-3 text-primary" />
        <h1 className="font-semibold text-foreground">Universal Inbox</h1>
        <div className="ml-auto flex gap-2">
            <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value as any)}
                className="bg-transparent text-xs font-medium text-muted-foreground focus:outline-none cursor-pointer"
            >
                <option value="all">All Tasks</option>
                {/* Could implement filtering logic if needed */}
            </select>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-2">
        {sortedTasks.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">No tasks found. Get to work!</div>
        ) : (
            sortedTasks.map(task => (
                <div key={task.id} className={`group flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-border/60 hover:bg-accent/30 transition-all ${task.status === "Done" ? "opacity-50" : ""}`}>
                    
                    {/* Checkbox */}
                    <button onClick={() => handleToggle(task)} className="mt-0.5 shrink-0 hover:scale-110 transition-transform">
                        {taskStatusIcon[task.status]}
                    </button>

                    <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${task.status === "Done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {task.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                            {/* Project or Category */}
                            {task.projects ? (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                    <Briefcase className="w-3 h-3" />
                                    {task.projects.name}
                                </span>
                            ) : task.category ? (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent text-muted-foreground">
                                    {categoryIcon[task.category] ?? <Tag className="w-3 h-3" />}
                                    {task.category}
                                </span>
                            ) : null}

                            {/* Priority Badge */}
                            <span className={`px-1.5 py-0.5 rounded border ${
                                task.priority === "Critical" ? "border-red-500/30 text-red-500 bg-red-500/10" :
                                task.priority === "High" ? "border-amber-500/30 text-amber-500 bg-amber-500/10" :
                                "border-transparent text-muted-foreground/60"
                            }`}>
                                {task.priority}
                            </span>
                            
                            {/* Due Date */}
                            {task.is_recurring && <span className="flex items-center gap-1 text-blue-400"><CheckSquare className="w-3 h-3" /> Recurring</span>}
                            
                            {task.due_date && (
                                <span className={`flex items-center gap-1 ${isPast(parseISO(task.due_date)) && task.status !== "Done" ? "text-red-400 font-bold" : ""}`}>
                                    <Calendar className="w-3 h-3" />
                                    {formatDistanceToNow(parseISO(task.due_date), { addSuffix: true })}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
}
