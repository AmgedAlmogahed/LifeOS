"use client";

import { useState, useTransition } from "react";
import type { AuthorityApplication } from "@/lib/actions/authority-applications";
import { createAuthorityApplication, updateAuthorityApplication, deleteAuthorityApplication } from "@/lib/actions/authority-applications";
import { Shield, Plus, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, Trash2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

const STATUS_CONFIG: Record<AuthorityApplication["status"], { label: string; color: string; icon: React.ReactNode }> = {
  not_submitted:          { label: "Not Submitted",    color: "text-muted-foreground bg-muted/50",                   icon: <Clock className="w-3 h-3" /> },
  submitted:              { label: "Submitted",         color: "text-blue-400 bg-blue-500/10",                        icon: <Clock className="w-3 h-3" /> },
  under_review:           { label: "Under Review",      color: "text-amber-400 bg-amber-500/10",                      icon: <AlertCircle className="w-3 h-3" /> },
  approved:               { label: "Approved",          color: "text-emerald-400 bg-emerald-500/10",                  icon: <CheckCircle2 className="w-3 h-3" /> },
  rejected:               { label: "Rejected",          color: "text-red-400 bg-red-500/10",                          icon: <XCircle className="w-3 h-3" /> },
  requires_resubmission:  { label: "Resubmit Required", color: "text-orange-400 bg-orange-500/10",                    icon: <RefreshCw className="w-3 h-3" /> },
};

const STATUSES = Object.keys(STATUS_CONFIG) as AuthorityApplication["status"][];

interface AuthorityTabProps {
  projectId: string;
  applications: AuthorityApplication[];
}

export function AuthorityTab({ projectId, applications }: AuthorityTabProps) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    authority_name: "",
    permit_type: "",
    tracking_id: "",
    submission_date: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.authority_name.trim() || !form.permit_type.trim()) return;
    startTransition(async () => {
      await createAuthorityApplication(projectId, {
        ...form,
        tracking_id: form.tracking_id || undefined,
        submission_date: form.submission_date || undefined,
        notes: form.notes || undefined,
      });
      setForm({ authority_name: "", permit_type: "", tracking_id: "", submission_date: "", notes: "" });
      setShowForm(false);
    });
  };

  const handleStatusChange = (id: string, status: AuthorityApplication["status"]) => {
    startTransition(async () => {
      await updateAuthorityApplication(id, projectId, { status });
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteAuthorityApplication(id, projectId);
    });
  };

  // Compute days waiting client-side as fallback (DB has GENERATED ALWAYS column)
  const daysWaiting = (submissionDate: string | null): number | null => {
    if (!submissionDate) return null;
    const diff = Date.now() - new Date(submissionDate).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="p-3 space-y-3">
      {/* Add button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border/60 text-xs text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Authority Application
      </button>

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-card/40 border border-primary/20 rounded-xl p-3 space-y-2"
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-2">
            New Application
          </p>
          {[
            { field: "authority_name", placeholder: "Authority (e.g. Municipality)", required: true },
            { field: "permit_type",    placeholder: "Permit type (e.g. Building Permit)", required: true },
            { field: "tracking_id",    placeholder: "Tracking ID (optional)" },
            { field: "submission_date",placeholder: "", type: "date" },
          ].map(({ field, placeholder, required, type }) => (
            <input
              key={field}
              type={type ?? "text"}
              required={required}
              placeholder={placeholder}
              value={(form as Record<string, string>)[field]}
              onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
              className="w-full bg-muted/20 border border-border rounded px-2.5 py-1.5 text-xs outline-none focus:border-primary transition-colors"
            />
          ))}
          <textarea
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            rows={2}
            className="w-full bg-muted/20 border border-border rounded px-2.5 py-1.5 text-xs outline-none focus:border-primary transition-colors resize-none"
          />
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={isPending || !form.authority_name.trim() || !form.permit_type.trim()}
              className="flex-1 py-1.5 rounded bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save Application"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 rounded bg-muted text-muted-foreground text-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Application list */}
      {applications.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Shield className="w-10 h-10 text-muted-foreground/15 mb-2" />
          <p className="text-xs text-muted-foreground/60">No permit applications yet.</p>
          <p className="text-[11px] text-muted-foreground/40 mt-1">Track government approvals here.</p>
        </div>
      )}

      <div className="space-y-2">
        {applications.map((app) => {
          const cfg = STATUS_CONFIG[app.status];
          const days = daysWaiting(app.submission_date);

          return (
            <div
              key={app.id}
              className="bg-card/40 border border-border/40 rounded-xl p-3 space-y-2 group"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">{app.authority_name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{app.permit_type}</div>
                </div>
                <button
                  onClick={() => handleDelete(app.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {/* Status badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={app.status}
                  onChange={(e) => handleStatusChange(app.id, e.target.value as AuthorityApplication["status"])}
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border-none outline-none cursor-pointer",
                    cfg.color
                  )}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s} className="bg-background text-foreground normal-case">
                      {STATUS_CONFIG[s].label}
                    </option>
                  ))}
                </select>

                {app.tracking_id && (
                  <span className="text-[10px] font-mono text-muted-foreground">
                    #{app.tracking_id}
                  </span>
                )}
              </div>

              {/* Timing row */}
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                {app.submission_date && (
                  <span>Submitted {formatDate(app.submission_date)}</span>
                )}
                {days !== null && days > 0 && (
                  <span className={cn(
                    "font-semibold",
                    days > 60 ? "text-red-400" : days > 30 ? "text-amber-400" : "text-muted-foreground"
                  )}>
                    ⏱ {days}d waiting
                  </span>
                )}
              </div>

              {app.notes && (
                <p className="text-[11px] text-muted-foreground/70 italic line-clamp-2">{app.notes}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
