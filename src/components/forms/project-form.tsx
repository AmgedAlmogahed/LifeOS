"use client";

import { useState, useTransition } from "react";
import { Modal, Field, TextInput, TextArea, SelectInput, SubmitButton } from "@/components/ui/modal";
import { createProject } from "@/lib/actions/projects";
import { Hammer, CheckCircle2, ChevronRight, ArrowLeft } from "lucide-react";
import type { Client } from "@/types/database";

interface Props {
  open: boolean;
  onClose: () => void;
  clients: Client[];
  accounts: any[];
}

const serviceTypes = [
  { value: "Cloud", label: "☁️ Cloud" },
  { value: "Web", label: "🌐 Web" },
  { value: "Design", label: "🎨 Design" },
  { value: "Marketing", label: "📣 Marketing" },
];

export function ProjectForm({ open, onClose, clients, accounts }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [ownership, setOwnership] = useState<"client" | "internal" | "personal">("client");
  const [accountId, setAccountId] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");

  const filteredClients = clients.filter(c => !accountId || (c as any).account_id === accountId);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    // Explicitly append state that might not be in the final step's unmounted inputs
    if (ownership === "personal") {
        form.set("account_id", "");
        form.set("client_id", "");
    } else if (ownership === "internal") {
        form.set("account_id", accountId);
        form.set("client_id", "");
    } else {
        form.set("account_id", accountId);
        form.set("client_id", clientId);
    }

    startTransition(async () => {
      const result = await createProject(form);
      if (result.error) setError(result.error);
      else {
        // Reset and close
        setStep(1);
        setOwnership("client");
        onClose();
      }
    });
  }

  return (
    <Modal open={open} onClose={() => { setStep(1); onClose(); }} title="New Project" icon={<Hammer className="w-4 h-4" />}>
      {/* Progress Dots */}
      <div className="flex items-center gap-2 mb-6 px-1">
        {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === s ? "bg-primary text-primary-foreground" : step > s ? "bg-primary/20 text-primary" : "bg-accent text-muted-foreground"}`}>
                    {step > s ? <CheckCircle2 className="w-3.5 h-3.5" /> : s}
                </div>
                {s < 3 && <div className={`h-1 w-8 rounded-full ${step > s ? "bg-primary/20" : "bg-accent"}`} />}
            </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-3">
                    <label className="text-sm font-medium">Ownership Structure</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {(["client", "internal", "personal"] as const).map(type => (
                            <div 
                                key={type} 
                                onClick={() => setOwnership(type)}
                                className={`p-4 rounded-xl border border-border cursor-pointer transition-all ${ownership === type ? 'bg-primary/5 border-primary ring-1 ring-primary' : 'hover:bg-accent'}`}
                            >
                                <div className="text-sm font-semibold capitalize mb-1">{type} Project</div>
                                <div className="text-[10px] text-muted-foreground">
                                    {type === "client" ? "For an external client" : type === "internal" ? "Internal company project" : "Personal side project"}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {ownership !== "personal" && (
                    <div className="space-y-4 max-w-sm">
                        <Field label="Operating Entity (Company)" name="_account">
                            <select 
                                value={accountId} 
                                onChange={(e) => { setAccountId(e.target.value); setClientId(""); }} 
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="" disabled>Select Company</option>
                                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </Field>

                        {ownership === "client" && (
                            <Field label="Client" name="_client">
                                <select 
                                    value={clientId} 
                                    onChange={(e) => setClientId(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    disabled={!accountId}
                                >
                                    <option value="" disabled>{!accountId ? "Select Entity First" : "Select Client"}</option>
                                    {filteredClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </Field>
                        )}
                    </div>
                )}
                
                <div className="flex justify-end pt-4">
                    <button 
                        type="button" 
                        onClick={() => setStep(2)}
                        disabled={ownership !== "personal" && !accountId || (ownership === "client" && !clientId)}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                        Next Step <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}

        {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <Field label="Framework Category" name="category" required>
                    <SelectInput name="category" options={[
                    { value: "Personal", label: "🧘 Personal / Internal" },
                    { value: "ERP", label: "🏢 ERP / Platform" },
                    { value: "WebApp", label: "💻 Web Application" },
                    { value: "SimpleWebsite", label: "📄 Simple Website" },
                    { value: "MobileApp", label: "📱 Mobile App" },
                    { value: "Marketing", label: "📣 Marketing" },
                    { value: "Branding", label: "🎨 Branding" },
                    { value: "Consulting", label: "🗣️ Consulting" },
                    ]} />
                </Field>

                <div className="p-4 bg-accent/50 rounded-lg border border-border">
                    <div className="text-xs font-semibold mb-2 flex items-center gap-2"><Hammer className="w-3.5 h-3.5"/> Will auto-generate:</div>
                    <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                        <li>Phase schema (e.g. Understand, Document, Implement...)</li>
                        <li>Automated sprint board layout</li>
                        <li>Template folder structure</li>
                    </ul>
                </div>

                <div className="flex justify-between pt-4">
                    <button type="button" onClick={() => setStep(1)} className="px-4 py-2 hover:bg-accent rounded-lg text-sm font-medium flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button type="button" onClick={() => setStep(3)} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                        Next Step <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}

        {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <Field label="Project Name" name="name" required>
                    <TextInput name="name" required placeholder="Acme Cloud Migration" />
                </Field>

                <Field label="Description" name="description">
                    <TextArea name="description" placeholder="Scope, goals, deliverables..." />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                    <Field label="Service Type" name="service_type">
                        <SelectInput name="service_type" options={serviceTypes} />
                    </Field>
                    <Field label="Budget" name="budget">
                        <TextInput name="budget" type="number" placeholder="50k" />
                    </Field>
                </div>

                <Field label="Initial Specs (Markdown)" name="specs_md">
                    <TextArea name="specs_md" rows={4} placeholder="# Requirements\n\n..." />
                </Field>

                {error && <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
                
                <div className="flex justify-between pt-4 border-t border-border mt-6">
                    <button type="button" onClick={() => setStep(2)} className="px-4 py-2 hover:bg-accent rounded-lg text-sm font-medium flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <SubmitButton label="Launch Project" pending={pending} />
                </div>
            </div>
        )}
      </form>
    </Modal>
  );
}
