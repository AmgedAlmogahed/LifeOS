"use client";

import { useState } from "react";
import { 
  FileText, 
  ExternalLink, 
  Download, 
  MoreVertical, 
  Trash2, 
  Brain, 
  Eye, 
  EyeOff,
  Filter,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

interface Document {
    id: string;
    title: string;
    category: string;
    file_type: string;
    file_size_bytes: number;
    file_url: string;
    ai_summary: string | null;
    ai_key_points: string[] | null;
    is_context_active: boolean;
    created_at: string;
    summary_generated_at: string | null;
}

interface DocumentListProps {
    documents: Document[];
    onDelete?: (id: string) => Promise<void>;
    onToggleContext?: (id: string, active: boolean) => Promise<void>;
}

const CATEGORIES = [
  "All",
  "Contract",
  "Proposal",
  "Requirements",
  "Design",
  "Correspondence",
  "Invoice",
  "Reference",
  "Internal"
];

export function DocumentList({ documents, onDelete, onToggleContext }: DocumentListProps) {
    const [filter, setFilter] = useState("All");
    const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

    const filteredDocs = filter === "All" 
        ? documents 
        : documents.filter(d => d.category.toLowerCase() === filter.toLowerCase());

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-md text-xs font-medium text-muted-foreground mr-2">
                    <Filter className="w-3.5 h-3.5" />
                    Filters
                </div>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                            filter === cat 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="grid gap-3">
                {filteredDocs.length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed border-border rounded-xl">
                        <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No documents found in this category.</p>
                    </div>
                ) : (
                    filteredDocs.map(doc => (
                        <div 
                            key={doc.id} 
                            className={cn(
                                "group bg-card border rounded-xl transition-all overflow-hidden",
                                doc.is_context_active ? "border-primary/20 shadow-sm" : "border-border/60 opacity-80"
                            )}
                        >
                            <div className="p-4 flex items-start gap-4">
                                <div className={cn(
                                    "p-2.5 rounded-lg shrink-0",
                                    doc.is_context_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                )}>
                                    <FileText className="w-5 h-5" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className="font-semibold text-sm truncate">{doc.title}</h4>
                                        {!doc.is_context_active && (
                                            <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                Excluded from Context
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                        <span className="font-medium text-primary/80 capitalize">{doc.category}</span>
                                        <span className="flex items-center gap-1">
                                            <span className="uppercase text-[10px] bg-muted/40 px-1 rounded">{doc.file_type.split('/').pop()}</span>
                                            {formatSize(doc.file_size_bytes)}
                                        </span>
                                        <span>Uploaded {formatDistanceToNow(new Date(doc.created_at))} ago</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 w-8 p-0"
                                        onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                                    >
                                        {expandedDoc === doc.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </Button>
                                    
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem className="gap-2">
                                                <ExternalLink className="w-4 h-4" /> View Full Document
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="gap-2">
                                                <Download className="w-4 h-4" /> Download
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem 
                                                className="gap-2"
                                                onClick={() => onToggleContext?.(doc.id, !doc.is_context_active)}
                                            >
                                                {doc.is_context_active ? (
                                                    <><EyeOff className="w-4 h-4" /> Remove from Context</>
                                                ) : (
                                                    <><Eye className="w-4 h-4" /> Include in Context</>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem 
                                                className="gap-2 text-destructive focus:text-destructive"
                                                onClick={() => onDelete?.(doc.id)}
                                            >
                                                <Trash2 className="w-4 h-4" /> Delete Permanently
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {/* AI Summary Section */}
                            <div className={cn(
                                "border-t bg-muted/20 pb-0 overflow-hidden transition-all duration-300",
                                expandedDoc === doc.id ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 border-transparent"
                            )}>
                                <div className="p-4 space-y-4">
                                    <div className="flex items-start gap-2.5">
                                        <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-500 mt-0.5">
                                            <Brain className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="space-y-1">
                                            <h5 className="text-[11px] font-bold text-purple-500 uppercase tracking-widest flex items-center gap-1.5">
                                                AI Intelligence Summary
                                                {doc.summary_generated_at ? (
                                                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                                                ) : (
                                                    <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
                                                )}
                                            </h5>
                                            {doc.ai_summary ? (
                                                <p className="text-xs text-foreground leading-relaxed">
                                                    {doc.ai_summary}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-muted-foreground italic">
                                                    Summarization in progress...
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {doc.ai_key_points && doc.ai_key_points.length > 0 && (
                                        <div className="flex gap-2.5 pl-7">
                                            <div className="space-y-1.5">
                                                <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Key Takeaways</h5>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                                                    {doc.ai_key_points.map((point, i) => (
                                                        <div key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                                                            <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                                                            {point}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
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
