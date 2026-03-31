"use client";

import { useState } from "react";
import { Phone, MessageCircle, Mail, Users, Building, FileText, CheckCircle, FileSignature } from "lucide-react";

export interface LogEntry {
  id: string;
  type: "CALL" | "WHATSAPP" | "EMAIL" | "MEETING" | "SITE_VISIT" | "QUOTE_SENT" | "CONTRACT_SIGNED" | "NOTE";
  timestamp: string;
  summary: string;
  sentiment: "Positive" | "Neutral" | "Negative";
  next_step?: string;
  follow_up_date?: string;
}

const interactionIcons = {
  CALL: <Phone className="w-4 h-4" />,
  WHATSAPP: <MessageCircle className="w-4 h-4" />,
  EMAIL: <Mail className="w-4 h-4" />,
  MEETING: <Users className="w-4 h-4" />,
  SITE_VISIT: <Building className="w-4 h-4" />,
  QUOTE_SENT: <FileText className="w-4 h-4" />,
  CONTRACT_SIGNED: <FileSignature className="w-4 h-4" />,
  NOTE: <CheckCircle className="w-4 h-4" />
};

const sentimentColors = {
  Positive: "text-emerald-500 bg-emerald-500/10",
  Neutral: "text-muted-foreground bg-accent",
  Negative: "text-red-500 bg-red-500/10"
};

export function CommunicationTimeline({ logs = [] }: { logs: LogEntry[] }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-xl">
        <MessageCircle className="w-8 h-8 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">No communication history</p>
        <button className="text-xs btn-gradient px-3 py-1.5 mt-3">Log Interaction</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">Interaction History</h3>
        <button className="text-xs btn-gradient px-3 py-1.5">Log Interaction</button>
      </div>
      
      <div className="relative border-l border-border/50 ml-3 pl-6 space-y-6 pb-4">
        {logs.map(log => (
          <div key={log.id} className="relative">
            {/* Timeline dot/icon */}
            <div className="absolute -left-[35px] top-0 w-7 h-7 bg-card border border-border rounded-full flex items-center justify-center text-primary z-10 shadow-sm">
              {interactionIcons[log.type]}
            </div>
            
            <div className="glass-card p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{log.type.replace('_', ' ')}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${sentimentColors[log.sentiment]}`}>
                    {log.sentiment}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">{new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              
              <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                {log.summary}
              </p>
              
              {(log.next_step || log.follow_up_date) && (
                <div className="mt-3 p-3 bg-accent/20 rounded-md border border-border/50 flex flex-col gap-1.5">
                  {log.next_step && <div className="text-xs"><span className="font-semibold text-muted-foreground">Next:</span> {log.next_step}</div>}
                  {log.follow_up_date && <div className="text-xs"><span className="font-semibold text-amber-500">Follow-up:</span> {new Date(log.follow_up_date).toLocaleDateString()}</div>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
