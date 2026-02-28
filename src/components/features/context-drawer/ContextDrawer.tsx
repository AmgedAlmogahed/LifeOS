"use client";

import { useState } from "react";
import type { Task, ProjectAsset, Invoice, Milestone } from "@/types/database";
import type { AuthorityApplication } from "@/lib/actions/authority-applications";
import type { ScopeNode } from "@/lib/actions/scope-nodes";
import { AssetsTab } from "./AssetsTab";
import { FinanceTab } from "./FinanceTab";
import { AuthorityTab } from "./AuthorityTab";
import { FolderOpen, DollarSign, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

type DrawerTab = "assets" | "finance" | "authority";

interface ContextDrawerProps {
  projectId: string;
  projectBudget: number;
  assets: ProjectAsset[];
  invoices: Invoice[];
  milestones: Milestone[];
  authorityApplications: AuthorityApplication[];
  scopeNodes: ScopeNode[];
}

export function ContextDrawer({
  projectId, projectBudget, assets, invoices, milestones, authorityApplications, scopeNodes,
}: ContextDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>("assets");

  const tabs: { id: DrawerTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "assets",    label: "Assets",    icon: <FolderOpen className="w-3.5 h-3.5" />, count: assets.length },
    { id: "finance",   label: "Finance",   icon: <DollarSign className="w-3.5 h-3.5" />, count: invoices.length },
    { id: "authority", label: "Authority", icon: <Shield className="w-3.5 h-3.5" />, count: authorityApplications.length },
  ];

  return (
    <div className="flex flex-col h-full border-l border-border bg-card/5">
      {/* Tab Strip */}
      <div className="flex items-center border-b border-border shrink-0 bg-card/20">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-semibold border-b-2 transition-colors flex-1 justify-center",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="text-[9px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 font-bold">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "assets" && (
          <AssetsTab projectId={projectId} assets={assets} />
        )}
        {activeTab === "finance" && (
          <FinanceTab
            projectId={projectId}
            projectBudget={projectBudget}
            invoices={invoices}
            milestones={milestones}
            scopeNodes={scopeNodes}
          />
        )}
        {activeTab === "authority" && (
          <AuthorityTab
            projectId={projectId}
            applications={authorityApplications}
          />
        )}
      </div>
    </div>
  );
}
