"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ScopeNode, createScopeNode, deleteScopeNode } from "@/lib/actions/scope-nodes";
import { ScopeTreeNode } from "./ScopeTreeNode";
import { Plus, Network } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScopeTreeProps {
  projectId: string;
  nodes: ScopeNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

function buildTree(nodes: ScopeNode[]): (ScopeNode & { children: ScopeNode[] })[] {
  const map = new Map<string, ScopeNode & { children: ScopeNode[] }>();
  nodes.forEach((n) => map.set(n.id, { ...n, children: [] }));
  const roots: (ScopeNode & { children: ScopeNode[] })[] = [];
  map.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

export function ScopeTree({ projectId, nodes, selectedId, onSelect }: ScopeTreeProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAddRoot, setShowAddRoot] = useState(false);
  const [rootTitle, setRootTitle] = useState("");

  const tree = buildTree(nodes);

  const handleAddRoot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rootTitle.trim()) return;
    startTransition(async () => {
      const result = await createScopeNode(projectId, rootTitle.trim(), "Portal", null);
      if (result?.error) console.error("[addRoot]", result.error);
      setRootTitle("");
      setShowAddRoot(false);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteScopeNode(id, projectId);
      if (selectedId === id) onSelect(null);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-1.5">
          <Network className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Scope Tree
          </span>
        </div>
        <button
          onClick={() => setShowAddRoot(true)}
          className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Add root node"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* "All Tasks" anchor */}
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "w-full text-left px-3 py-2 text-xs font-medium transition-colors border-b border-border/50",
          selectedId === null
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        📋 All Tasks
      </button>

      {/* Tree */}
      <nav className="flex-1 overflow-y-auto py-1">
        {tree.length === 0 && !showAddRoot && (
          <div className="px-3 py-6 text-center">
            <p className="text-[11px] text-muted-foreground/50 italic">
              No scope nodes yet.
            </p>
            <button
              onClick={() => setShowAddRoot(true)}
              className="mt-2 text-[11px] text-primary hover:underline"
            >
              Add first node
            </button>
          </div>
        )}

        {tree.map((node) => (
          <ScopeTreeNode
            key={node.id}
            node={node}
            depth={0}
            projectId={projectId}
            selectedId={selectedId}
            onSelect={onSelect}
            onDelete={handleDelete}
          />
        ))}

        {/* Add root form */}
        {showAddRoot && (
          <form onSubmit={handleAddRoot} className="px-3 py-2 flex items-center gap-1.5">
            <input
              autoFocus
              value={rootTitle}
              onChange={(e) => setRootTitle(e.target.value)}
              placeholder="Portal name..."
              className="flex-1 bg-muted/30 border border-primary/40 rounded px-2 py-1 text-xs outline-none focus:border-primary"
              onKeyDown={(e) => e.key === "Escape" && (setShowAddRoot(false), setRootTitle(""))}
            />
            <button
              type="submit"
              disabled={!rootTitle.trim() || isPending}
              className="text-[10px] px-2 py-1 bg-primary text-primary-foreground rounded disabled:opacity-50"
            >
              Add
            </button>
          </form>
        )}
      </nav>
    </div>
  );
}
