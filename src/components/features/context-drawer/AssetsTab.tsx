"use client";

import { useState, useTransition, useRef } from "react";
import type { ProjectAsset } from "@/types/database";
import { createProjectAsset } from "@/lib/actions/assets";
import { uploadFile } from "@/lib/storage";
import { useRouter } from "next/navigation";
import {
  Github, Figma, Database, FileText, ExternalLink,
  Upload, Loader2, FolderOpen, FileQuestion, History,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ASSET_ICONS: Record<string, React.ReactNode> = {
  github:   <Github className="w-4 h-4" />,
  figma:    <Figma className="w-4 h-4" />,
  supabase: <Database className="w-4 h-4" />,
  docs:     <FileText className="w-4 h-4" />,
  other:    <FileQuestion className="w-4 h-4" />,
};

const TYPE_GROUPS = ["github", "figma", "supabase", "docs", "other"];

interface AssetsTabProps {
  projectId: string;
  assets: ProjectAsset[];
}

export function AssetsTab({ projectId, assets }: AssetsTabProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [collapseGroups, setCollapseGroups] = useState<Record<string, boolean>>({});

  const grouped = TYPE_GROUPS.reduce<Record<string, ProjectAsset[]>>((acc, type) => {
    acc[type] = assets.filter((a) => a.asset_type === type);
    return acc;
  }, {});

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    try {
      setUploading(true);
      const url = await uploadFile("projects", file);
      await createProjectAsset(projectId, url, file.name, "docs");
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-3 space-y-3">
      {/* Upload button */}
      <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border/60 text-xs text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-50"
      >
        {uploading
          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
          : <><Upload className="w-3.5 h-3.5" /> Upload Document</>
        }
      </button>

      {/* Groups */}
      {TYPE_GROUPS.map((type) => {
        const group = grouped[type];
        if (group.length === 0) return null;
        const isCollapsed = collapseGroups[type];
        return (
          <div key={type}>
            <button
              onClick={() => setCollapseGroups((p) => ({ ...p, [type]: !p[type] }))}
              className="flex items-center gap-1.5 w-full text-left mb-1.5"
            >
              <span className="text-muted-foreground">{ASSET_ICONS[type]}</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground capitalize">
                {type}
              </span>
              <span className="text-[9px] bg-muted text-muted-foreground rounded px-1 ml-auto">
                {group.length}
              </span>
            </button>

            {!isCollapsed && (
              <div className="space-y-1.5">
                {group.map((asset) => (
                  <a
                    key={asset.id}
                    href={asset.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-accent/20 hover:bg-accent/40 transition-colors group"
                  >
                    <span className="text-muted-foreground group-hover:text-foreground shrink-0">
                      {ASSET_ICONS[asset.asset_type] ?? ASSET_ICONS.other}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{asset.label}</div>
                      <div className="text-[10px] text-muted-foreground/50 truncate">{asset.url}</div>
                    </div>
                    <ExternalLink className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary/50 shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {assets.length === 0 && !uploading && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FolderOpen className="w-10 h-10 text-muted-foreground/20 mb-2" />
          <p className="text-xs text-muted-foreground/60">No assets linked yet.</p>
          <p className="text-[11px] text-muted-foreground/40 mt-1">Upload a file or link a repo above.</p>
        </div>
      )}
    </div>
  );
}
