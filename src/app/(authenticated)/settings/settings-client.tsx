"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SystemConfig } from "@/types/database";
import { Settings, ToggleLeft, ToggleRight, Code2 } from "lucide-react";

interface SettingsClientProps {
  config: SystemConfig[];
}

export function SettingsClient({ config }: SettingsClientProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Operational configuration and system preferences.
        </p>
      </div>

      {/* Config Cards */}
      <div className="space-y-3">
        {config.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
            <Settings className="w-12 h-12 mb-3 text-zinc-700" />
            <p className="text-sm font-medium">No configuration entries</p>
            <p className="text-xs text-zinc-700 mt-1">
              Configuration will appear here once set.
            </p>
          </div>
        ) : (
          config.map((item) => {
            const val = item.value as Record<string, unknown>;
            const isToggle = typeof val.enabled === "boolean";
            const enabled = val.enabled as boolean;
            const description = (val.description as string) || "";

            return (
              <Card
                key={item.key}
                className="bg-zinc-900/60 backdrop-blur-sm border-white/[0.06] hover:border-white/[0.1] transition-all"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-violet-500/10">
                      <Code2 className="w-4 h-4 text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-sm font-semibold text-white font-mono">
                        {item.key}
                      </CardTitle>
                      {description && (
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {description}
                        </p>
                      )}
                    </div>
                    {isToggle && (
                      <div className="flex items-center gap-2">
                        {enabled ? (
                          <ToggleRight className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-zinc-500" />
                        )}
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            enabled
                              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                              : "text-zinc-500 bg-zinc-500/10 border-zinc-500/20"
                          }`}
                        >
                          {enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    )}
                    {!isToggle && (
                      <pre className="text-[10px] font-mono text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded max-w-[200px] truncate">
                        {JSON.stringify(val)}
                      </pre>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
