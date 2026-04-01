"use client";

import { useState } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Upload, 
    FileText, 
    X, 
    Loader2, 
    CheckCircle2, 
    AlertCircle,
    BrainCircuit 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadFile } from "@/lib/actions/storage";
import { createDocument } from "@/lib/actions/documents";

interface DocumentUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientId?: string;
    projectId?: string;
    projects?: { id: string, name: string }[];
}

const CATEGORIES = [
    "contract", "proposal", "brief", "requirements", 
    "design", "invoice", "correspondence", "reference", "internal"
];

export function DocumentUploadModal({ 
    isOpen, 
    onClose, 
    clientId, 
    projectId: initialProjectId, 
    projects 
}: DocumentUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("general");
    const [projectId, setProjectId] = useState(initialProjectId || "");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            if (!title) {
                // Auto-fill title from filename (remove extension)
                setTitle(selected.name.replace(/\.[^/.]+$/, ""));
            }
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setUploadStatus('idle');

        try {
            // 1. Upload to Storage
            const path = clientId 
                ? `clients/${clientId}/${Date.now()}_${file.name}`
                : `projects/${projectId}/${Date.now()}_${file.name}`;
            
            const formData = new FormData();
            formData.append("file", file);
            
            const fileUrl = await uploadFile("documents", path, formData);

            // 2. Create DB Record
            const doc = await createDocument({
                client_id: clientId,
                project_id: projectId || null,
                title,
                file_url: fileUrl,
                file_name: file.name,
                file_type: file.type,
                file_size_bytes: file.size,
                category,
                is_context_active: true
            });

            // 3. Trigger AI Summarization (async - don't wait for response for UI success)
            fetch("/api/documents/summarize", {
                method: "POST",
                body: JSON.stringify({ document_id: doc.id }),
            }).catch(err => console.error("Immediate summary trigger failed:", err));

            setUploadStatus('success');
            setTimeout(() => {
                onClose();
                resetForm();
            }, 1500);
        } catch (err: any) {
            setUploadStatus('error');
            setErrorMessage(err.message || "Failed to upload document");
        } finally {
            setIsUploading(false);
        }
    };

    const resetForm = () => {
        setFile(null);
        setTitle("");
        setCategory("general");
        setUploadStatus('idle');
        setErrorMessage("");
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Upload Document
                    </DialogTitle>
                    <DialogDescription>
                        Add documents to your context. Supported: PDF, DOCX, MD, TXT.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* File Drop/Input */}
                    {!file ? (
                        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors relative">
                            <input 
                                type="file" 
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                                accept=".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg"
                            />
                            <div className="flex flex-col items-center">
                                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                                <p className="text-sm font-medium">Click to browse or drag & drop</p>
                                <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, MD, or TXT up to 50MB</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg border border-border">
                            <div className="p-2 bg-background rounded border">
                                <FileText className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-[10px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setFile(null)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    <div className="grid gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="title">Document Title</Label>
                            <Input 
                                id="title" 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)} 
                                placeholder="e.g. Master Services Agreement"
                                className="h-9"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="category">Category</Label>
                                <select 
                                    id="category"
                                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                >
                                    <option value="general">General</option>
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                                    ))}
                                </select>
                            </div>

                            {projects && projects.length > 0 && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="project">Link to Project</Label>
                                    <select 
                                        id="project"
                                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        value={projectId}
                                        onChange={(e) => setProjectId(e.target.value)}
                                    >
                                        <option value="">Client-level only</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {uploadStatus === 'error' && (
                        <div className="p-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2 text-xs">
                            <AlertCircle className="w-4 h-4" />
                            {errorMessage}
                        </div>
                    )}

                    {uploadStatus === 'success' && (
                        <div className="p-3 bg-green-500/10 text-green-600 rounded-lg flex items-center gap-2 text-xs font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            Document uploaded! Starting AI analysis...
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="ghost" onClick={onClose} disabled={isUploading}>Cancel</Button>
                    <Button 
                        onClick={handleUpload} 
                        disabled={!file || !title || isUploading || uploadStatus === 'success'}
                        className="bg-primary hover:bg-primary/90"
                    >
                        {isUploading ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                        ) : (
                            <><BrainCircuit className="w-4 h-4 mr-2" /> Upload & Summarize</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
