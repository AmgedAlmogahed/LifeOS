"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ScopeNode, createScopeNode, deleteScopeNode, updateScopeNode } from "@/lib/actions/scope-nodes";
import { cn } from "@/lib/utils";
import {
  ChevronRight, ChevronDown, Plus, Trash2, Pencil,
  Building2, Package, Wrench, LayoutList,
} from "lucide-react";

// DB stores these as 'Module', 'Task Group', etc. — match what's in the DB default
const NODE_ICONS: Record<string, React.ReactNode> = {
  Portal:      <Building2 className="w-3 h-3 shrink-0" />,
  Module:      <Package className="w-3 h-3 shrink-0" />,
  Discipline:  <Wrench className="w-3 h-3 shrink-0" />,
  "Task Group":<LayoutList className="w-3 h-3 shrink-0" />,
  // lowercase fallbacks in case data was stored with old values
  portal:      <Building2 className="w-3 h-3 shrink-0" />,
  module:      <Package className="w-3 h-3 shrink-0" />,
  discipline:  <Wrench className="w-3 h-3 shrink-0" />,
  task_group:  <LayoutList className="w-3 h-3 shrink-0" />,
};

// What type does a child node get when added?
const CHILD_TYPE: Record<string, string> = {
  Portal:     "Module",
  Module:     "Discipline",
  Discipline: "Task Group",
  "Task Group": "Task Group",
  portal:     "Module",
  module:     "Discipline",
  discipline: "Task Group",
  task_group: "Task Group",
};

interface ScopeTreeNodeProps {
  node: ScopeNode & { children: ScopeNode[] };
  depth: number;
  projectId: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
}

export function ScopeTreeNode({
  node, depth, projectId, selectedId, onSelect, onDelete,
}: ScopeTreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);
  const editInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isSelected = selectedId === node.id;

  useEffect(() => {
    if (editing) editInputRef.current?.focus();
  }, [editing]);

  const handleRename = () => {
    if (!editTitle.trim() || editTitle.trim() === node.title) {
      setEditing(false);
      setEditTitle(node.title);
      return;
    }
    startTransition(async () => {
      const result = await updateScopeNode(node.id, editTitle.trim(), projectId);
      if (result?.error) console.error("[rename]", result.error);
      setEditing(false);
      router.refresh();
    });
  };

  const handleAddChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const childType = CHILD_TYPE[node.node_type] ?? "Module";
    startTransition(async () => {
      const result = await createScopeNode(projectId, newTitle.trim(), childType, node.id);
      if (result?.error) console.error("[addChild]", result.error);
      setNewTitle("");
      setShowAdd(false);
      setExpanded(true);
      router.refresh();
    });
  };

  return (
    <div>
      {/* Row */}
      <div
        className={cn(
          "group flex items-center gap-1 px-2 py-1 cursor-pointer select-none transition-colors rounded-sm mx-1",
          isSelected
            ? "bg-primary/15 text-primary"
            : "hover:bg-accent/60 text-muted-foreground hover:text-foreground"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => onSelect(isSelected ? null : node.id)}
      >
        {/* Expand/collapse */}
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className="shrink-0 opacity-50 hover:opacity-100"
        >
          {hasChildren ? (
            expanded
              ? <ChevronDown className="w-3 h-3" />
              : <ChevronRight className="w-3 h-3" />
          ) : (
            <div className="w-3" />
          )}
        </button>

        {/* Icon + Title */}
        <span className={cn("shrink-0", isSelected ? "text-primary" : "text-muted-foreground")}>
          {NODE_ICONS[node.node_type] ?? <Package className="w-3 h-3 shrink-0" />}
        </span>

        {editing ? (
          <input
            ref={editInputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") { setEditing(false); setEditTitle(node.title); }
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 bg-muted/30 border border-primary/40 rounded px-1.5 py-0.5 text-xs outline-none focus:border-primary"
          />
        ) : (
          <span
            className="flex-1 truncate text-xs font-medium"
            onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); setEditTitle(node.title); }}
          >
            {node.title}
          </span>
        )}

        {/* Hover actions */}
        {!editing && (
          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setEditing(true); setEditTitle(node.title); }}
              className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Rename"
            >
              <Pencil className="w-3 h-3" />
            </button>
            {depth < 3 && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowAdd(!showAdd); setExpanded(true); }}
                className="p-0.5 rounded hover:bg-primary/20 hover:text-primary transition-colors"
                title="Add child node"
              >
                <Plus className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
              className="p-0.5 rounded hover:bg-red-500/20 hover:text-red-400 transition-colors"
              title="Delete node"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Add child form */}
      {showAdd && (
        <form
          onSubmit={handleAddChild}
          className="flex items-center gap-1 mx-1 mt-0.5 mb-1"
          style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={`New ${CHILD_TYPE[node.node_type] ?? "child"}...`}
            className="flex-1 bg-muted/30 border border-primary/40 rounded px-2 py-0.5 text-[11px] outline-none focus:border-primary"
            onKeyDown={(e) => e.key === "Escape" && (setShowAdd(false), setNewTitle(""))}
          />
          <button
            type="submit"
            disabled={!newTitle.trim() || isPending}
            className="text-[10px] px-1.5 py-0.5 bg-primary text-primary-foreground rounded disabled:opacity-50"
          >
            Add
          </button>
        </form>
      )}

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {(node.children as (ScopeNode & { children: ScopeNode[] })[]).map((child) => (
            <ScopeTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              projectId={projectId}
              selectedId={selectedId}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
