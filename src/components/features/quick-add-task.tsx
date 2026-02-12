"use client";

import { useState, useEffect } from "react";
import { Plus, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createTask } from "@/lib/actions/tasks";
import { TaskCategory, TaskPriority } from "@/types/database";

const categories: TaskCategory[] = ["Business", "Personal", "Social", "Research", "Habit"];
const priorities: TaskPriority[] = ["Critical", "High", "Medium", "Low"];

export function QuickAddTaskBtn({ collapsed }: { collapsed?: boolean }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<{id: string, name: string}[]>([]);
  
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [category, setCategory] = useState<TaskCategory | "">("Personal");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
      if (open && projects.length === 0) {
          const supabase = createClient();
          supabase.from("projects").select("id, name").order("name").then(({ data }) => {
              if (data) setProjects(data);
          });
      }
  }, [open, projects.length]);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;
      
      setLoading(true);
      try {
          await createTask({
              title: title.trim(),
              status: "Todo",
              type: "Implementation",
              priority,
              category: (category as TaskCategory) || null,
              project_id: projectId || null,
              due_date: dueDate ? new Date(dueDate).toISOString() : null,
              is_recurring: false,
              recurrence_rule: null,
              reminder_sent: false,
              metadata: {},
              agent_context: {}
          });
          setOpen(false);
          setTitle("");
      } catch (err) {
          console.error(err);
          alert("Failed to create task");
      } finally {
          setLoading(false);
      }
  };

  return (
      <>
          {collapsed ? (
              <button 
                  onClick={() => setOpen(true)}
                  className="flex items-center justify-center w-full aspect-square rounded-lg text-primary bg-primary/10 hover:bg-primary/20 transition-colors my-2 border border-primary/20 mx-auto"
                  title="Quick Add Task"
              >
                  <Plus className="w-4 h-4" />
              </button>
          ) : (
              <button 
                  onClick={() => setOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-primary bg-primary/10 hover:bg-primary/20 transition-colors mt-4 mb-2 border border-primary/20"
              >
                  <Plus className="w-4 h-4" /> Quick Task
              </button>
          )}

          {open && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 relative">
                      <h2 className="text-lg font-semibold text-foreground mb-4">Quick Add Task</h2>
                      
                      <form onSubmit={handleSubmit} className="space-y-4">
                          <div>
                              <input 
                                  autoFocus
                                  type="text" 
                                  placeholder="What needs to be done?" 
                                  className="w-full px-3 py-2 bg-accent/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                                  value={title}
                                  onChange={e => setTitle(e.target.value)}
                              />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                              <div>
                                  <label className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider block mb-1.5">Category</label>
                                  <select 
                                      className="w-full px-2 py-1.5 bg-accent/50 border border-border rounded-lg text-sm text-foreground focus:outline-none"
                                      value={category}
                                      onChange={e => { setCategory(e.target.value as any); setProjectId(""); }}
                                  >
                                      <option value="">None</option>
                                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                              </div>
                              <div>
                                  <label className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider block mb-1.5">Project (Optional)</label>
                                  <select 
                                      className="w-full px-2 py-1.5 bg-accent/50 border border-border rounded-lg text-sm text-foreground focus:outline-none"
                                      value={projectId}
                                      onChange={e => { setProjectId(e.target.value); if(e.target.value) setCategory(""); }}
                                  >
                                      <option value="">None</option>
                                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                  </select>
                              </div>
                          </div>

                           <div className="grid grid-cols-2 gap-3">
                              <div>
                                  <label className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider block mb-1.5">Priority</label>
                                  <select 
                                      className="w-full px-2 py-1.5 bg-accent/50 border border-border rounded-lg text-sm text-foreground focus:outline-none"
                                      value={priority}
                                      onChange={e => setPriority(e.target.value as any)}
                                  >
                                      {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                                  </select>
                              </div>
                              <div>
                                  <label className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider block mb-1.5">Due Date</label>
                                  <input 
                                      type="date"
                                      className="w-full px-2 py-1.5 bg-accent/50 border border-border rounded-lg text-sm text-foreground focus:outline-none"
                                      value={dueDate}
                                      onChange={e => setDueDate(e.target.value)}
                                  />
                              </div>
                           </div>
                           
                           <div className="flex justify-end gap-3 pt-2">
                               <button 
                                  type="button" 
                                  onClick={() => setOpen(false)}
                                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                               >
                                   Cancel
                               </button>
                               <button 
                                  type="submit" 
                                  disabled={loading || !title.trim()}
                                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                               >
                                   {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                   Create Task
                               </button>
                           </div>
                      </form>
                  </div>
              </div>
          )}
      </>
  );
}
