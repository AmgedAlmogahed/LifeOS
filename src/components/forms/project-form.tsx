"use client";

import { useState, useTransition } from "react";
import { Modal, Field, TextInput, TextArea, SelectInput, SubmitButton } from "@/components/ui/modal";
import { createProject } from "@/lib/actions/projects";
import { Hammer } from "lucide-react";
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createProject(form);
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="New Project" icon={<Hammer className="w-4 h-4" />}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Project Name" name="name" required>
          <TextInput name="name" required placeholder="Acme Cloud Migration" />
        </Field>

        <Field label="Description" name="description">
          <TextArea name="description" placeholder="Scope, goals, deliverables..." />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Client" name="client_id">
            <SelectInput name="client_id" options={clients.map((c) => ({ value: c.id, label: c.name }))} />
          </Field>
          <Field label="Service Type" name="service_type">
            <SelectInput name="service_type" options={serviceTypes} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Account (Domain Entity)" name="account_id">
            <SelectInput name="account_id" options={accounts.map((a) => ({ value: a.id, label: a.name }))} />
          </Field>
          <Field label="Budget" name="budget">
            <TextInput name="budget" type="number" placeholder="50000" />
          </Field>
        </div>

        <Field label="Initial Specs (Markdown)" name="specs_md">
          <TextArea name="specs_md" rows={4} placeholder="# Requirements\n\n..." />
        </Field>

        {error && <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
        <SubmitButton label="Create Project" pending={pending} />
      </form>
    </Modal>
  );
}
