"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  width?: string;
}

export function Modal({ open, onClose, title, icon, children, width = "max-w-lg" }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* panel */}
      <div ref={ref} className={`relative ${width} w-full mx-4 glass-card border border-border/60 shadow-2xl fade-in`}
        style={{ maxHeight: "85vh" }}>

        {/* header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50">
          {icon && <span className="text-primary">{icon}</span>}
          <h2 className="text-sm font-bold text-foreground flex-1">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* body */}
        <div className="px-6 py-5 overflow-y-auto" style={{ maxHeight: "calc(85vh - 120px)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── Reusable Form Field Components ─────────────────────────────────────── */

interface FieldProps {
  label: string;
  name: string;
  required?: boolean;
  children?: React.ReactNode;
}

export function Field({ label, name, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full h-9 px-3 bg-accent/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all";
const selectCls = inputCls;
const textareaCls = "w-full px-3 py-2 bg-accent/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none";

export function TextInput({ name, required, placeholder, defaultValue, type = "text" }: { name: string; required?: boolean; placeholder?: string; defaultValue?: string; type?: string }) {
  return <input id={name} name={name} required={required} placeholder={placeholder} defaultValue={defaultValue} type={type} className={inputCls} />;
}

export function SelectInput({ name, required, options, defaultValue }: { name: string; required?: boolean; options: { value: string; label: string }[]; defaultValue?: string }) {
  return (
    <select id={name} name={name} required={required} defaultValue={defaultValue} className={selectCls}>
      <option value="">Select...</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function TextArea({ name, required, placeholder, defaultValue, rows = 3 }: { name: string; required?: boolean; placeholder?: string; defaultValue?: string; rows?: number }) {
  return <textarea id={name} name={name} required={required} placeholder={placeholder} defaultValue={defaultValue} rows={rows} className={textareaCls} />;
}

export function SubmitButton({ label = "Save", pending = false }: { label?: string; pending?: boolean }) {
  return (
    <button type="submit" disabled={pending} className="btn-gradient px-5 py-2.5 text-sm w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
      {pending ? "Saving..." : label}
    </button>
  );
}

export function ColorInput({ name, defaultValue = "#6366f1" }: { name: string; defaultValue?: string }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" id={name} name={name} defaultValue={defaultValue} className="w-9 h-9 rounded-lg border border-border cursor-pointer bg-transparent" />
      <input type="text" name={`${name}_hex`} defaultValue={defaultValue} readOnly className="flex-1 h-9 px-3 bg-accent/30 border border-border rounded-lg text-xs text-muted-foreground data-mono" />
    </div>
  );
}
