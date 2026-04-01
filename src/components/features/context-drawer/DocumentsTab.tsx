"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
    FileStack, 
    Upload, 
    Bot, 
    AlertCircle, 
    Plus,
    BrainCircuit,
    ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentList } from "../documents/DocumentList";
import { DocumentUploadModal } from "../documents/DocumentUploadModal";
import { ContextBundlePreview } from "../documents/ContextBundlePreview";
import { deleteDocument } from "@/lib/actions/documents";

interface DocumentsTabProps {
    projectId: string;
    documents: any[];
    contextBundle?: any;
}

export function DocumentsTab({ projectId, documents, contextBundle }: DocumentsTabProps) {
    const router = useRouter();
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isContextPreviewOpen, setIsContextPreviewOpen] = useState(false);

    return (
        <div className="flex flex-col h-full space-y-4 p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileStack className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold">Project Documents</h3>
                </div>
                <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                    onClick={() => setIsUploadOpen(true)}
                >
                    <Plus className="w-4 h-4" />
                </Button>
            </div>

            {/* AI Status Banner */}
            <div 
                className="p-2.5 rounded-lg border border-primary/20 bg-primary/5 flex flex-col gap-2 cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => setIsContextPreviewOpen(true)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-wider">
                        <BrainCircuit className="w-3.5 h-3.5" />
                        Agent Context
                    </div>
                    {contextBundle?.is_stale && (
                        <div className="text-[9px] text-amber-600 flex items-center gap-1 font-bold">
                            <AlertCircle className="w-3 h-3" /> STALE
                        </div>
                    )}
                </div>
                <div className="text-[11px] text-muted-foreground line-clamp-2">
                    {contextBundle?.context_text ? 
                        "Project context is compiled and available for agents." : 
                        "No brain context generated for this project yet."}
                </div>
                <div className="flex items-center gap-1 text-[9px] text-primary/60 font-medium">
                    View full bundle <ExternalLink className="w-2.5 h-2.5" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto -mx-1 px-1">
                <DocumentList 
                    documents={documents} 
                    onDelete={async (id) => {
                        if (confirm("Delete document?")) {
                            await deleteDocument(id);
                            router.refresh();
                        }
                    }}
                    onToggleContext={async (id, active) => {
                        const { createClient } = await import("@/lib/supabase/client");
                        const supabase = createClient();
                        await supabase.from("documents").update({ is_context_active: active } as any).eq("id", id);
                        router.refresh();
                    }}
                />
            </div>

            <DocumentUploadModal 
                isOpen={isUploadOpen} 
                onClose={() => {
                    setIsUploadOpen(false);
                    router.refresh();
                }}
                projectId={projectId}
            />

            <ContextBundlePreview 
                isOpen={isContextPreviewOpen}
                onClose={() => setIsContextPreviewOpen(false)}
                type="project"
                entityId={projectId}
                entityName="Current Project"
                initialContext={contextBundle?.context_text}
                isStale={contextBundle?.is_stale}
            />
        </div>
    );
}
