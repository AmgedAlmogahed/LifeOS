"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Box, FolderKanban, Plus } from "lucide-react";
import type { Module, Project } from "@/types/database";

export function ModulesClient({ modules, projects }: { modules: Module[], projects: Project[] }) {
  // Simple module view
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
      <div className="px-6 py-8 border-b border-border/40 bg-card/30 backdrop-blur-xl shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Box className="w-8 h-8 text-primary" />
              Modules
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Features and epics grouped by priority.
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all btn-gradient">
            <Plus className="w-4 h-4" />
            New Module
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1 w-full bg-muted/10 p-6">
         <div className="max-w-7xl mx-auto w-full pb-24 space-y-8">
            {modules.length === 0 ? (
                <div className="text-center py-24 text-muted-foreground italic">
                    No modules found. Create one to get started.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map(mod => {
                        const project = projects.find(p => p.id === mod.project_id);
                        return (
                            <Card key={mod.id} className="hover:border-primary/50 transition-colors shadow-sm group">
                                <CardHeader className="p-5">
                                    <div className="flex justify-between items-start gap-2 mb-2">
                                        <CardTitle className="text-lg leading-tight">{mod.name}</CardTitle>
                                        <Badge variant="secondary" className="shrink-0">
                                            Priority {mod.priority_level ?? 0}
                                        </Badge>
                                    </div>
                                    <CardDescription className="flex items-center gap-2 text-xs">
                                        <FolderKanban className="w-3.5 h-3.5" />
                                        {project?.name ?? "Unknown Project"}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        )
                    })}
                </div>
            )}
         </div>
      </ScrollArea>
    </div>
  );
}
