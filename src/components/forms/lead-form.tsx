"use client";

import { useState, useTransition } from "react";
import { Modal, Field, TextInput, TextArea, SelectInput, SubmitButton } from "@/components/ui/modal";
import { createLead } from "@/lib/actions/leads";
import { UserPlus, ChevronRight, ChevronLeft } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  accounts: { id: string; name: string }[];
}

const channels = [
  { value: "CH-REF", label: "🤝 Referral / Relationship", desc: "Someone referred this lead" },
  { value: "CH-SOC", label: "📱 Social Media", desc: "LinkedIn, Twitter, Instagram, etc." },
  { value: "CH-WEB", label: "🌐 Website / Email", desc: "Came through website or email" },
  { value: "CH-MAP", label: "📞 Direct Call / Google Maps", desc: "Called directly or found on Maps" },
  { value: "CH-AI", label: "🤖 AI Chatbot", desc: "Captured by AI chatbot" },
  { value: "CH-OUT", label: "📤 Cold Outreach", desc: "You reached out to them" },
];

const priorities = [
  { value: "Normal", label: "Normal" },
  { value: "High", label: "🔥 High" },
  { value: "Urgent", label: "🚨 Urgent" },
];

const socialPlatforms = [
  { value: "LinkedIn", label: "LinkedIn" },
  { value: "Twitter", label: "Twitter/X" },
  { value: "Instagram", label: "Instagram" },
  { value: "TikTok", label: "TikTok" },
];

export function LeadForm({ open, onClose, accounts }: Props) {
  const [step, setStep] = useState(1);
  const [accountId, setAccountId] = useState("");
  const [channel, setChannel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleClose = () => {
    setStep(1);
    setAccountId("");
    setChannel("");
    setError(null);
    onClose();
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    form.set("account_id", accountId);
    form.set("channel", channel);

    startTransition(async () => {
      const result = await createLead(form);
      if (result.error) setError(result.error);
      else handleClose();
    });
  }

  const selectedAccount = accounts.find((a) => a.id === accountId);

  return (
    <Modal open={open} onClose={handleClose} title="Capture Lead" icon={<UserPlus className="w-4 h-4" />}>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-5">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
              step >= s ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground"
            }`}>
              {s}
            </div>
            {s < 3 && <ChevronRight className="w-3 h-3 text-muted-foreground/30" />}
          </div>
        ))}
        <span className="text-[10px] text-muted-foreground/50 ml-2">
          {step === 1 ? "Company" : step === 2 ? "Channel" : "Details"}
        </span>
      </div>

      {/* Step 1: Select Company */}
      {step === 1 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mb-3">Which company is this lead for?</p>
          {accounts.map((acc) => (
            <button
              key={acc.id}
              type="button"
              onClick={() => { setAccountId(acc.id); setStep(2); }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                accountId === acc.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30 hover:bg-accent/20"
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                {acc.name.charAt(0)}
              </div>
              <span className="text-sm font-medium text-foreground">{acc.name}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 ml-auto" />
            </button>
          ))}
          {accounts.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No companies found. Add a company in Settings first.
            </p>
          )}
        </div>
      )}

      {/* Step 2: Select Channel */}
      {step === 2 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <button type="button" onClick={() => setStep(1)} className="p-1 hover:bg-accent rounded-md transition-colors">
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <p className="text-xs text-muted-foreground">How did this lead come in?</p>
            <span className="text-[10px] text-primary/60 ml-auto">{selectedAccount?.name}</span>
          </div>
          {channels.map((ch) => (
            <button
              key={ch.value}
              type="button"
              onClick={() => { setChannel(ch.value); setStep(3); }}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-accent/20 transition-all text-left"
            >
              <span className="text-lg">{ch.label.split(" ")[0]}</span>
              <div className="flex-1">
                <span className="text-sm font-medium text-foreground">{ch.label.split(" ").slice(1).join(" ")}</span>
                <span className="text-[10px] text-muted-foreground/50 block">{ch.desc}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
            </button>
          ))}
        </div>
      )}

      {/* Step 3: Lead details form */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <button type="button" onClick={() => setStep(2)} className="p-1 hover:bg-accent rounded-md transition-colors">
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <span className="text-[10px] text-primary/60">{selectedAccount?.name}</span>
            <span className="text-[10px] text-muted-foreground/30">→</span>
            <span className="text-[10px] text-primary/60">{channels.find((c) => c.value === channel)?.label.split(" ").slice(1).join(" ")}</span>
          </div>

          <Field label="Contact Name" name="contact_name" required>
            <TextInput name="contact_name" required placeholder="Ahmed Al Rashid" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Mobile" name="mobile">
              <TextInput name="mobile" placeholder="+966 5X XXX XXXX" />
            </Field>
            <Field label="Email" name="email">
              <TextInput name="email" type="email" placeholder="ahmed@company.com" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority" name="priority">
              <SelectInput name="priority" options={priorities} defaultValue="Normal" />
            </Field>
            <Field label="Estimated Value (SAR)" name="estimated_value">
              <TextInput name="estimated_value" type="number" placeholder="50000" />
            </Field>
          </div>

          <Field label="Region" name="region">
            <TextInput name="region" placeholder="Riyadh, Jeddah, Eastern Province..." />
          </Field>

          <Field label="Source Detail" name="source_detail">
            <TextInput name="source_detail" placeholder="e.g. from Ahmed's referral, LinkedIn DM" />
          </Field>

          {/* Channel-specific fields */}
          {channel === "CH-REF" && (
            <>
              <Field label="Referral Person Name" name="referral_name" required>
                <TextInput name="referral_name" required placeholder="Who referred this lead?" />
              </Field>
              <Field label="Relationship" name="relationship">
                <TextInput name="relationship" placeholder="Friend, colleague, client..." />
              </Field>
            </>
          )}

          {channel === "CH-SOC" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Platform" name="platform">
                <SelectInput name="platform" options={socialPlatforms} />
              </Field>
              <Field label="Post/Message Link" name="post_link">
                <TextInput name="post_link" placeholder="https://..." />
              </Field>
            </div>
          )}

          {channel === "CH-WEB" && (
            <Field label="Page URL" name="page_url">
              <TextInput name="page_url" placeholder="https://..." />
            </Field>
          )}

          {channel === "CH-OUT" && (
            <>
              <Field label="Outreach Method" name="outreach_method">
                <TextInput name="outreach_method" placeholder="Cold email, LinkedIn message..." />
              </Field>
              <Field label="Context" name="outreach_context">
                <TextArea name="outreach_context" placeholder="Why did you reach out?" />
              </Field>
            </>
          )}

          <Field label="Notes" name="notes">
            <TextArea name="notes" placeholder="Any additional notes..." />
          </Field>

          {error && <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
          <SubmitButton label="Capture Lead" pending={pending} />
        </form>
      )}
    </Modal>
  );
}
