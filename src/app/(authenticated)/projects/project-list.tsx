import { useState } from "react";
import Link from "next/link";
import { 
  FolderKanban, ArrowRight, Search, Lock, 
  LayoutGrid, List as ListIcon, Plus, ChevronDown,
  Filter, ArrowUpDown, Calendar, Target,
  User, Users, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const phaseStyles: Record<string, { css: string; bg: string; border: string }> = {
  Understand: { css: "phase-understand", bg: "phase-bg-understand", border: "phase-border-understand" },
  Document:   { css: "phase-document",   bg: "phase-bg-document",   border: "phase-border-document" },
  Freeze:     { css: "phase-freeze",     bg: "phase-bg-freeze",     border: "phase-border-freeze" },
  Implement:  { css: "phase-implement",  bg: "phase-bg-implement",  border: "phase-border-implement" },
  Verify:     { css: "phase-verify",     bg: "phase-bg-verify",     border: "phase-border-verify" },
};

export { ProjectList };

import { useCompanyFilter } from "@/components/providers/company-filter-context";

function ProjectList({ projects }: { projects: any[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ownershipFilter, setOwnershipFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"updated" | "name" | "progress" | "date">("updated");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  
  const { selectedCompany } = useCompanyFilter();

  const filtered = projects.filter((p) => {
    // 1. Text Search
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    
    // 2. Status Match
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    
    // 3. Ownership Type Match
    if (ownershipFilter !== "all") {
      const isClient = !!p.client_id;
      const isInternal = !!p.account_id && !p.client_id;
      const isPersonal = !p.account_id && !p.client_id;
      if (ownershipFilter === "client" && !isClient) return false;
      if (ownershipFilter === "internal" && !isInternal) return false;
      if (ownershipFilter === "personal" && !isPersonal) return false;
    }

    // 4. Category Filter
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    
    // 5. Global Company Filter
    if (selectedCompany !== "all") {
      if (selectedCompany === "personal" && p.account_id !== null) return false;
      // Deep match for internal projects if we had company IDs in current view
    }
    
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "progress") return b.progress - a.progress;
    if (sortBy === "date") {
      if (!a.target_date) return 1;
      if (!b.target_date) return -1;
      return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
    }
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const categories = Array.from(new Set(projects.map(p => p.category).filter(Boolean)));

  return (
    <div className="flex flex-col h-full bg-background/50">
      {/* ─── HEADER ────────────────────────────────────────────────────────── */}
      <div className="h-16 border-b border-border flex items-center px-6 bg-card/50 backdrop-blur-md shrink-0 gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <FolderKanban className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground">Project Forge</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{sorted.length} Active Projects</span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Search */}
          <div className="relative group">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="h-9 pl-9 pr-3 bg-accent/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 w-48 xl:w-64 transition-all"
            />
          </div>

          <div className="h-4 w-[1px] bg-border mx-1" />

          {/* View Toggles */}
          <div className="flex bg-accent/50 p-1 rounded-lg border border-border">
            <button
              onClick={() => setViewMode("cards")}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === "cards" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === "table" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-[1px] bg-border mx-1" />

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-9 bg-accent/50 border border-border rounded-xl text-xs font-medium text-foreground px-3 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:bg-accent transition-colors cursor-pointer"
          >
            <option value="updated">Recently Updated</option>
            <option value="name">Alphabetical</option>
            <option value="progress">Most Progress</option>
            <option value="date">Target Date</option>
          </select>

          <Button className="h-9 rounded-xl gap-2 px-4 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Project</span>
          </Button>
        </div>
      </div>

      {/* ─── FILTERS BAR ──────────────────────────────────────────────────── */ }
      <div className="h-12 border-b border-border flex items-center px-6 bg-card/30 shrink-0 gap-6 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">
          <Filter className="w-3 h-3" /> Filters:
        </div>

        {/* Ownership */}
        <div className="flex items-center gap-1.5">
          {["all", "client", "internal", "personal"].map((opt) => (
            <button
              key={opt}
              onClick={() => setOwnershipFilter(opt)}
              className={cn(
                "px-3 py-1 rounded-full text-[11px] font-semibold border transition-all whitespace-nowrap",
                ownershipFilter === opt 
                  ? "bg-primary/10 border-primary/30 text-primary" 
                  : "bg-transparent border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {opt === "all" ? "All Owners" : opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>

        <div className="h-4 w-[1px] bg-border shrink-0" />

        {/* Status */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setStatusFilter("all")}
            className={cn(
              "px-3 py-1 rounded-full text-[11px] font-semibold border transition-all",
              statusFilter === "all" ? "bg-primary/10 border-primary/30 text-primary" : "bg-transparent border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            All Phases
          </button>
          {["Understand", "Document", "Freeze", "Implement", "Verify"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1 rounded-full text-[11px] font-semibold border transition-all",
                statusFilter === s ? "bg-primary/10 border-primary/30 text-primary" : "bg-transparent border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {categories.length > 0 && (
          <>
            <div className="h-4 w-[1px] bg-border shrink-0" />
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCategoryFilter("all")}
                className={cn(
                  "px-3 py-1 rounded-full text-[11px] font-semibold border transition-all",
                  categoryFilter === "all" ? "bg-primary/10 border-primary/30 text-primary" : "bg-transparent border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                All Categories
              </button>
              {categories.map((c: any) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[11px] font-semibold border transition-all",
                    categoryFilter === c ? "bg-primary/10 border-primary/30 text-primary" : "bg-transparent border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ─── CONTENT ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {sorted.length === 0 ? (
          <div className="glass-card p-20 text-center flex flex-col items-center justify-center border-dashed border-2">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-4">
              <FolderKanban className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-sm font-bold text-foreground mb-1">No matches found</h3>
            <p className="text-xs text-muted-foreground max-w-[200px]">Adjust your filters or search criteria to find what you're looking for.</p>
            <Button variant="outline" className="mt-6 h-8 text-xs rounded-lg" onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setOwnershipFilter("all");
              setCategoryFilter("all");
            }}>
              Clear all filters
            </Button>
          </div>
        ) : viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sorted.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="glass-card overflow-hidden border-border/50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-accent/30 border-b border-border/50">
                  <th className="px-5 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Project</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Status</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Progress</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ownership</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Deadlines</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {sorted.map((p) => (
                  <ProjectRow key={p.id} project={p} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: any }) {
  const phase = phaseStyles[project.status] ?? phaseStyles.Understand;
  const hasClient = !!project.client_id;
  const isInternal = !!project.account_id && !project.client_id;
  const isPersonal = !project.account_id && !project.client_id;
  
  let ownershipIcon = <User className="w-3 h-3" />;
  let ownershipLabel = "Personal";
  let badgeColor = "text-gray-400 bg-gray-400/10 border-gray-400/20";
  
  if (hasClient) {
    ownershipIcon = <Building2 className="w-3 h-3" />;
    ownershipLabel = project.clients?.name || "Client";
    badgeColor = "text-blue-400 bg-blue-400/10 border-blue-400/20";
  } else if (isInternal) {
    ownershipIcon = <Users className="w-3 h-3" />;
    ownershipLabel = project.accounts?.name || "Internal";
    badgeColor = "text-indigo-400 bg-indigo-400/10 border-indigo-400/20";
  }

  return (
    <Link href={`/projects/${project.id}`} className="group block h-full">
      <div className="glass-card p-5 h-full flex flex-col hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden group-hover:-translate-y-1">
        {/* Hover Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-start justify-between mb-4">
            <div className={cn("px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider flex items-center gap-1", badgeColor)}>
              {ownershipIcon}
              {ownershipLabel}
            </div>
            {project.is_frozen && (
              <div className="text-sky-400 bg-sky-400/10 border border-sky-400/20 p-1 rounded-md" title="Frozen Spec">
                <Lock className="w-3 h-3" />
              </div>
            )}
          </div>

          <h3 className="text-sm font-bold text-foreground mb-1 mt-1 group-hover:text-primary transition-colors leading-snug line-clamp-2">
            {project.name}
          </h3>
          
          {project.category && (
             <div className="text-[10px] text-muted-foreground mb-4 uppercase tracking-widest font-semibold flex items-center gap-1.5 opacity-60">
                <Target className="w-3 h-3" /> {project.category}
             </div>
          )}

          <div className="mt-auto space-y-4">
            {/* Progress Bar Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={cn("text-[10px] font-bold uppercase tracking-tight", phase.css)}>
                  {project.status}
                </span>
                <span className="text-[10px] font-bold text-foreground/70">{project.progress}%</span>
              </div>
              <div className="h-1.5 bg-accent rounded-full overflow-hidden border border-border/50">
                <div 
                  className={cn("h-full rounded-full transition-all duration-1000", phase.bg)} 
                  style={{ width: `${project.progress}%` }} 
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-tighter">Updated</span>
                  <span className="text-[10px] text-foreground/60 font-medium">
                    {format(new Date(project.updated_at), "MMM d, HH:mm")}
                  </span>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-primary transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ProjectRow({ project }: { project: any }) {
  const phase = phaseStyles[project.status] ?? phaseStyles.Understand;
  const hasClient = !!project.client_id;
  const isInternal = !!project.account_id && !project.client_id;
  
  let label = "Personal";
  let dotColor = "bg-gray-400";
  
  if (hasClient) {
    label = project.clients?.name || "Client";
    dotColor = "bg-blue-400";
  } else if (isInternal) {
    label = project.accounts?.name || "Internal";
    dotColor = "bg-indigo-400";
  }

  return (
    <tr 
      className="group hover:bg-primary/5 transition-colors cursor-pointer"
      onClick={() => window.location.href = `/projects/${project.id}`}
    >
      <td className="px-5 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{project.name}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{project.category || "No Category"}</span>
        </div>
      </td>
      <td className="px-5 py-3 text-center">
        <span className={cn("px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border", phase.css, phase.bg, phase.border)}>
          {project.status}
        </span>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-accent rounded-full overflow-hidden min-w-[80px]">
            <div className={cn("h-full rounded-full", phase.bg)} style={{ width: `${project.progress}%` }} />
          </div>
          <span className="text-[10px] font-bold text-muted-foreground">{project.progress}%</span>
        </div>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          <div className={cn("w-1.5 h-1.5 rounded-full", dotColor)} />
          <span className="text-xs font-medium text-foreground">{label}</span>
        </div>
      </td>
      <td className="px-5 py-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{project.target_date ? format(new Date(project.target_date), "MMM d, yyyy") : "No target"}</span>
          </div>
        </div>
      </td>
      <td className="px-5 py-3 text-right">
        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
      </td>
    </tr>
  );
}
