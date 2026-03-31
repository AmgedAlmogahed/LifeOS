import { createClient } from "@/lib/supabase/server";
import { CopyPlus, Layers, GitMerge } from "lucide-react";
import type { ProjectTemplate } from "@/types/database";

export default async function SettingsTemplatesPage() {
  const supabase = await createClient();
  const { data } = await (supabase as any).from("project_templates").select("*").order("name");
  
  const templates = (data || []) as ProjectTemplate[];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Project Frameworks</h1>
        <p className="text-muted-foreground mt-2">
          Configure the automated life cycles, default tasks, and seed pipelines for different types of work.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {templates.map((tpl) => (
          <div key={tpl.id} className="border bg-card text-card-foreground shadow-sm rounded-xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  {tpl.name}
                </h3>
                <span className="text-xs bg-muted px-2 py-1 rounded-md font-medium text-muted-foreground">
                  {tpl.category}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 min-h-10 mb-6">
                {tpl.description}
              </p>

              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent">
                {tpl.phases.map((phase, idx) => (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                     <div className="flex items-center justify-center w-10 h-10 rounded-full border bg-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 shadow-sm">
                       <GitMerge className="w-4 h-4 text-muted-foreground" />
                     </div>
                     
                     <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-muted/30 p-4 rounded border text-sm shadow-sm transition-colors hover:bg-muted/50">
                       <div className="flex items-center justify-between mb-1">
                         <span className="font-medium">{phase.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">{phase.tasks.length} subtasks</span>
                       </div>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="col-span-full border-2 border-dashed rounded-xl p-12 text-center text-muted-foreground">
            <CopyPlus className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <h3>No frameworks found</h3>
            <p className="text-sm">Please run the latest database migrations to seed template frameworks.</p>
          </div>
        )}
      </div>
    </div>
  );
}
