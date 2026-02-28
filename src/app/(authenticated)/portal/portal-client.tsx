"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FolderKanban, Server, Box, Users } from "lucide-react";

export function PortalClient({ accounts, projects, modules, platforms }: any) {
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
      {/* Header */}
      <div className="px-6 py-8 border-b border-border/40 bg-card/30 backdrop-blur-xl shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Box className="w-8 h-8 text-primary" />
              Command Portal
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Centralized hub for Accounts, Platforms, Projects, and Modules.
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 w-full bg-muted/10 p-6">
         <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-24">
            
            {/* Accounts Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50 text-muted-foreground font-medium text-sm tracking-widest uppercase">
                <Users className="w-4 h-4" /> Accounts ({accounts.length})
              </div>
              <div className="flex flex-col gap-3">
                {accounts.length === 0 && <p className="text-xs text-muted-foreground italic">No accounts found.</p>}
                {accounts.map((acc: any) => (
                  <Card key={acc.id} className="hover:border-primary/50 transition-colors shadow-sm cursor-pointer group">
                    <CardHeader className="p-4 bg-muted/30 group-hover:bg-muted/50 transition-colors">
                      <CardTitle className="text-base">{acc.name}</CardTitle>
                      {acc.design_repo_url && (
                        <CardDescription className="text-xs truncate" title={acc.design_repo_url}>
                          {acc.design_repo_url}
                        </CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

            {/* Platforms Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50 text-muted-foreground font-medium text-sm tracking-widest uppercase">
                <Server className="w-4 h-4" /> Platforms ({platforms.length})
              </div>
              <div className="flex flex-col gap-3">
                {platforms.length === 0 && <p className="text-xs text-muted-foreground italic">No platforms configured.</p>}
                {platforms.map((plat: any) => (
                  <Card key={plat.id} className="hover:border-primary/50 transition-colors shadow-sm cursor-pointer border-dashed">
                    <CardHeader className="p-4 text-center">
                      <CardTitle className="text-sm text-muted-foreground">{plat.name}</CardTitle>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

            {/* Projects Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50 text-muted-foreground font-medium text-sm tracking-widest uppercase">
                <FolderKanban className="w-4 h-4" /> Projects ({projects.length})
              </div>
              <div className="flex flex-col gap-3">
                {projects.length === 0 && <p className="text-xs text-muted-foreground italic">No projects found.</p>}
                {projects.map((proj: any) => (
                  <Card key={proj.id} className="hover:border-primary/50 transition-colors shadow-sm cursor-pointer group">
                    <CardHeader className="p-4 bg-primary/5 group-hover:bg-primary/10 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-base leading-tight">{proj.name}</CardTitle>
                        <Badge variant="outline" className="shrink-0 text-[10px] capitalize">
                          {proj.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs pt-1 flex items-center gap-2">
                         <span>Budget: ${proj.budget ?? 0}</span>
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

            {/* Modules Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50 text-muted-foreground font-medium text-sm tracking-widest uppercase">
                <Box className="w-4 h-4" /> Modules ({modules.length})
              </div>
              <div className="flex flex-col gap-3">
                {modules.length === 0 && <p className="text-xs text-muted-foreground italic">No modules scheduled.</p>}
                {modules.map((mod: any) => (
                  <Card key={mod.id} className="hover:border-primary/50 transition-colors shadow-sm cursor-pointer group">
                    <CardHeader className="p-4 bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-base leading-tight">{mod.name}</CardTitle>
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                          P{mod.priority_level ?? 0}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

         </div>
      </ScrollArea>
    </div>
  );
}
