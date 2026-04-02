"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import type { Client, Opportunity, Contract, Project, AgentReport, ClientWithAccount } from "@/types/database";
import {
  ArrowLeft, Heart, FileText, FolderKanban, TrendingUp,
  Bot, ExternalLink, Globe, Palette, Upload, Loader2,
  Clock, DollarSign, FileStack, BookOpen, Activity, BrainCircuit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadFile } from "@/lib/storage";
import { updateClientLogo } from "@/lib/actions/assets";
import { DocumentList } from "@/components/features/documents/DocumentList";
import { DocumentUploadModal } from "@/components/features/documents/DocumentUploadModal";
import { ContextBundlePreview } from "@/components/features/documents/ContextBundlePreview";
import { deleteDocument, markContextStale } from "@/lib/actions/documents";
import { BackButton } from "@/components/ui/back-button";
import { CompanyBadge } from "@/components/ui/company-badge";

import { ClientHealthCard } from "@/components/features/clients/ClientHealthCard";
import { CommunicationTimeline } from "./communication-timeline";

function currency(v: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v); }

const stageColors: Record<string, string> = {
  Draft: "stage-draft", "Price Offer Sent": "stage-sent", Negotiating: "stage-negotiating", Won: "stage-won", Lost: "stage-lost",
};
const contractColors: Record<string, string> = {
  Draft: "text-muted-foreground", "Pending Signature": "text-amber-400", Active: "text-emerald-400", Completed: "text-blue-400", Terminated: "text-red-400",
};

type TabId = "profile" | "timeline" | "deals" | "projects" | "finance" | "documents" | "notes";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <Bot className="w-3.5 h-3.5" /> },
  { id: "timeline", label: "Timeline", icon: <Clock className="w-3.5 h-3.5" /> },
  { id: "deals", label: "Deals", icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { id: "projects", label: "Projects", icon: <FolderKanban className="w-3.5 h-3.5" /> },
  { id: "finance", label: "Finance", icon: <DollarSign className="w-3.5 h-3.5" /> },
  { id: "documents", label: "Documents", icon: <FileStack className="w-3.5 h-3.5" /> },
  { id: "notes", label: "Notes", icon: <BookOpen className="w-3.5 h-3.5" /> },
];

export function ClientDossier({
  client, opportunities, contracts, projects, agentReports, invoices, communicationLogs, documents, contextBundle
}: {
  client: ClientWithAccount; 
  opportunities: Opportunity[]; 
  contracts: Contract[]; 
  projects: Project[]; 
  agentReports: AgentReport[];
  invoices: any[];
  communicationLogs: any[];
  documents: any[];
  contextBundle: any;
}) {
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isContextPreviewOpen, setIsContextPreviewOpen] = useState(false);

  const activeContracts = contracts.filter((c) => c.status === "Active");
  const totalRevenue = activeContracts.reduce((s, c) => s + Number(c.total_value), 0);
  const unresolvedAlerts = agentReports.filter((r) => !r.is_resolved);

  // Auto-calculated classification metric (mocked for now, assumes recent activity based on health score)
  const classification = client.health_score >= 80 ? "VIP" : client.health_score > 40 ? "ACTIVE" : "DORMANT";

  const handleLogoClick = () => logoInputRef.current?.click();

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.length) return;
      const file = e.target.files[0];
      try {
          setLogoUploading(true);
          const url = await uploadFile("clients", file);
          await updateClientLogo(client.id, url);
          router.refresh();
      } catch(err) {
          console.error(err);
          alert("Logo upload failed");
      } finally {
          setLogoUploading(false);
          if (logoInputRef.current) logoInputRef.current.value = "";
      }
  };

  return (
    <div className="flex flex-col h-full">
      {/* ─── Top Bar & Header ───────────────────────────────────────────────── */}
      <div className="h-20 border-b flex items-center px-6 shrink-0" style={{
        borderColor: `${client.brand_primary}20`,
        background: `linear-gradient(90deg, ${client.brand_primary}08, transparent)`,
      }}>
        <BackButton fallbackHref="/clients" variant="ghost" size="icon" label="" className="h-10 w-10 mr-4 rounded-xl" />
        
        {/* LOGO */}
        <div className="relative group mr-4">
            <div 
                onClick={handleLogoClick}
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white overflow-hidden cursor-pointer relative shadow-sm border border-white/10"
                style={{ background: client.logo_url ? 'transparent' : `linear-gradient(135deg, ${client.brand_primary}, ${client.brand_secondary})` }}
            >
                {client.logo_url ? (
                    <img src={client.logo_url} alt={client.name} className="w-full h-full object-cover" />
                ) : (
                    client.name.charAt(0).toUpperCase()
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                    {logoUploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Upload className="w-4 h-4 text-white" />}
                </div>
            </div>
            <input type="file" ref={logoInputRef} onChange={handleLogoChange} accept="image/*" className="hidden" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-foreground">{client.name}</h1>
            <CompanyBadge account={client.accounts} size="sm" />
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              classification === 'VIP' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
              classification === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' :
              'bg-muted text-muted-foreground'
            }`}>
              {classification}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-xs text-muted-foreground">{(client as any).client_type || 'Standard Client'}</span>
            <span className="text-xs text-muted-foreground/60">{client.email || 'No email provided'}</span>
            <span className="text-xs text-primary font-medium">{projects.length} Active Projects</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5">
            <Heart className="w-4 h-4" style={{ color: client.health_score >= 80 ? "oklch(0.72 0.20 155)" : client.health_score > 40 ? "oklch(0.75 0.15 80)" : "oklch(0.63 0.24 25)" }} />
            <span className={`text-sm font-bold ${client.health_score >= 80 ? "text-emerald-500" : client.health_score > 40 ? "text-amber-500" : "text-red-500"}`}>{client.health_score}%</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Health Score</span>
        </div>
      </div>

      {/* ─── 7-Tab Navigation ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-6 pt-3 border-b border-border bg-card/10 shrink-0 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === tab.id 
              ? "border-primary text-primary bg-primary/5" 
              : "border-transparent text-muted-foreground hover:bg-accent/30 hover:text-foreground"
            }`}
          >
            {tab.icon}
            <span className="uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ─── Tab Content Views ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 bg-background space-y-6 fade-in">
        
        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-6">
                <h2 className="text-sm font-semibold mb-4 text-foreground flex items-center gap-2"><Bot className="w-4 h-4 text-primary"/> One-Sheet Details</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">Primary Contact</span>
                    <div className="text-sm font-medium">{client.phone || "—"}</div>
                    <div className="text-xs text-muted-foreground">{client.email || "—"}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">Total Liftetime Value</span>
                    <div className="text-lg font-bold gradient-text-revenue">{currency(totalRevenue)}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">Location</span>
                    <div className="text-sm font-medium">{(client as any).region || "—"}</div>
                    <div className="text-xs text-muted-foreground">{(client as any).city || "—"}</div>
                  </div>
                </div>
              </div>

              <ClientHealthCard healthScore={client.health_score} agentReports={agentReports} clientName={client.name} />
            </div>

            <div className="space-y-6">
              <div className="glass-card p-6">
                <h2 className="text-sm font-semibold mb-4 text-foreground flex items-center gap-2"><Palette className="w-4 h-4 text-primary"/> Brand Definition</h2>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    {[client.brand_primary, client.brand_secondary, client.brand_accent].map((c, i) => (
                      <div key={i} className="flex-1">
                        <div className="h-8 rounded-lg border border-border/30" style={{ background: c ?? undefined }} />
                        <div className="text-[9px] text-muted-foreground/50 font-mono mt-1 text-center">{c || 'N/A'}</div>
                      </div>
                    ))}
                  </div>
                  {client.brand_assets_url ? (
                    <a href={client.brand_assets_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs py-2 px-3 bg-accent rounded-md text-primary hover:underline group">
                      <Globe className="w-3.5 h-3.5 group-hover:animate-pulse" /> External Brand Assets <ExternalLink className="w-3 h-3 ml-auto" />
                    </a>
                  ) : (
                    <div className="text-xs text-muted-foreground p-3 border border-dashed border-border rounded-md text-center">No external brand assets linked</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TIMELINE TAB */}
        {activeTab === "timeline" && (
          <div className="max-w-3xl mx-auto animate-in fade-in duration-200">
             <div className="glass-card p-6">
                <CommunicationTimeline 
                  logs={communicationLogs.map(log => ({
                    id: log.id,
                    type: log.type || 'NOTE',
                    timestamp: log.logged_at || log.created_at,
                    summary: log.summary || log.content,
                    sentiment: log.sentiment || 'Neutral',
                    next_step: log.next_step,
                    follow_up_date: log.follow_up_date
                  }))} 
                />
             </div>
          </div>
        )}

        {/* DEALS TAB */}
        {activeTab === "deals" && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
              <div className="glass-card p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary"/> Sales Pipeline</h2>
                  <button className="text-[10px] btn-gradient px-3 py-1">New Deal</button>
                </div>
                {opportunities.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-lg">
                    <TrendingUp className="w-8 h-8 text-muted-foreground/30 mb-2"/>
                    <span className="text-xs text-muted-foreground">No active opportunities.</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {opportunities.map((o) => (
                      <div key={o.id} className="p-4 rounded-xl bg-accent/20 hover:bg-accent/40 transition-colors border border-border/50 group cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-semibold text-sm">{o.title}</div>
                          <span className="font-bold text-emerald-500 shadow-sm">{currency(Number(o.estimated_value))}</span>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide ${stageColors[o.stage] ?? "bg-accent"}`}>{o.stage}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors"><Activity className="w-3 h-3"/> View Details</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
           </div>
        )}

        {/* PROJECTS TAB */}
        {activeTab === "projects" && (
          <div className="animate-in fade-in">
            <div className="flex items-center justify-between mb-4">
               <h2 className="text-sm font-semibold text-foreground flex items-center gap-2"><FolderKanban className="w-4 h-4 text-primary"/> Active Projects</h2>
               <button className="text-xs btn-gradient px-3 py-1.5">Create Project</button>
            </div>
            {projects.length === 0 ? (
               <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
                  <FolderKanban className="w-10 h-10 text-muted-foreground/30 mb-3"/>
                  <span className="text-sm font-medium text-foreground">No Projects Yet</span>
                  <span className="text-xs text-muted-foreground mt-1">Convert a deal to launch a project for this client.</span>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((p) => (
                  <Link key={p.id} href={`/projects/${p.id}`} className="block">
                    <div className="glass-card p-5 hover:border-primary/40 transition-all hover:shadow-md hover:-translate-y-1">
                      <div className="text-sm font-bold text-foreground mb-4 truncate">{p.name}</div>
                      
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider phase-${p.status?.toLowerCase()}`}>{p.status}</span>
                        <span className="text-[10px] font-medium text-muted-foreground/80">{p.progress}% Completed</span>
                      </div>
                      
                      <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full relative" style={{ width: `${p.progress}%` }}>
                          <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-r from-transparent to-white/30" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FINANCE TAB */}
        {activeTab === "finance" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
             <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold flex items-center gap-2"><FileText className="w-4 h-4 text-primary"/> Signed Contracts</h2>
                  <button className="text-[10px] bg-accent hover:bg-primary/20 hover:text-primary px-3 py-1 rounded transition-colors">Draft Contract</button>
                </div>
                {contracts.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-border rounded-lg text-xs text-muted-foreground">No contracts found.</div>
                ) : (
                  <div className="space-y-3">
                    {contracts.map((c) => (
                      <div key={c.id} className="p-3 bg-background border border-border rounded-lg flex items-center gap-3 hover:border-primary/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">{c.title}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">Signed {new Date(c.start_date || c.created_at).toLocaleDateString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold">{currency(Number(c.total_value))}</div>
                          <span className={`text-[9px] uppercase tracking-wider font-bold ${contractColors[c.status] ?? "text-muted-foreground"}`}>{c.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-500"/> Invoice Ledger</h2>
                  <button className="text-[10px] btn-gradient px-3 py-1">New Invoice</button>
                </div>
                {invoices.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-border rounded-lg text-xs text-muted-foreground">No invoices found.</div>
                ) : (
                  <div className="space-y-3">
                    {invoices.map((inv) => (
                      <div key={inv.id} className="p-3 bg-background border border-border rounded-lg flex items-center gap-3 hover:border-primary/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">{inv.invoice_number || 'INV-001'}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">Due {new Date(inv.due_date).toLocaleDateString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold">{currency(Number(inv.amount))}</div>
                          <span className={`text-[9px] uppercase tracking-wider font-bold ${
                            inv.status === 'Paid' ? 'text-emerald-500' : 
                            inv.status === 'Sent' ? 'text-amber-500' : 'text-muted-foreground'
                          }`}>{inv.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === "documents" && (
          <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
             <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <FileStack className="w-5 h-5 text-indigo-500" /> 
                        Document Vault
                    </h2>
                    <p className="text-xs text-muted-foreground">Manage client contracts, requirements, and AI context.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => setIsContextPreviewOpen(true)}
                    >
                        <Bot className="w-4 h-4" /> Context Bundle
                    </Button>
                    <Button 
                        size="sm" 
                        className="btn-gradient gap-2"
                        onClick={() => setIsUploadOpen(true)}
                    >
                        <Upload className="w-4 h-4" /> Upload
                    </Button>
                </div>
             </div>

             <div className="glass-card p-6">
                <DocumentList 
                    documents={documents} 
                    onDelete={async (id) => {
                        if (confirm("Are you sure you want to delete this document?")) {
                            await deleteDocument(id);
                            router.refresh();
                        }
                    }}
                    onToggleContext={async (id, active) => {
                        // Using any to bypass typed update for now
                        const { createClient } = await import("@/lib/supabase/client");
                        const supabase = createClient();
                        await supabase.from("documents").update({ is_context_active: active } as any).eq("id", id);
                        router.refresh();
                    }}
                />
             </div>

             {/* Context Summary Footer */}
             <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-500/10 rounded-lg">
                      <BrainCircuit className="w-5 h-5 text-indigo-500" />
                   </div>
                   <div>
                      <div className="text-sm font-bold text-indigo-900 dark:text-indigo-100">AI Context Engine</div>
                      <div className="text-[11px] text-muted-foreground">
                        {contextBundle?.is_stale ? (
                            <span className="text-amber-600 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Changes pending. Regenerate bundle for agents.
                            </span>
                        ) : (
                            "Client context is synchronized and active for all agents."
                        )}
                      </div>
                   </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setIsContextPreviewOpen(true)} className="text-indigo-500 hover:text-indigo-600 hover:bg-indigo-500/10">
                    Preview Bundle <ExternalLink className="w-3 h-3 ml-2" />
                </Button>
             </div>

             <DocumentUploadModal 
                isOpen={isUploadOpen} 
                onClose={() => {
                    setIsUploadOpen(false);
                    router.refresh();
                }}
                clientId={client.id}
                projects={projects.map(p => ({ id: p.id, name: p.name }))}
             />

             <ContextBundlePreview 
                isOpen={isContextPreviewOpen}
                onClose={() => setIsContextPreviewOpen(false)}
                type="client"
                entityId={client.id}
                entityName={client.name}
                initialContext={contextBundle?.context_text}
                isStale={contextBundle?.is_stale}
             />
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === "notes" && (
          <div className="animate-in fade-in">
             <div className="glass-card p-0 overflow-hidden">
                <div className="p-4 border-b border-border bg-accent/30 flex items-center justify-between">
                   <h2 className="text-sm font-semibold flex items-center gap-2"><BookOpen className="w-4 h-4 text-amber-500" /> Internal Notes</h2>
                   <button className="text-xs btn-gradient px-3 py-1">Save Notes</button>
                </div>
                <textarea 
                  className="w-full h-[400px] bg-transparent p-6 text-sm resize-none focus:outline-none placeholder:text-muted-foreground/30 font-mono tracking-tight"
                  placeholder="Record strategic insights, personal preferences, or unstructured notes about this client here..."
                  defaultValue={client.notes || ""}
                />
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
