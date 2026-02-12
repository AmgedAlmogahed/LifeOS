"use client";

import { useState, useTransition } from "react";
import { Modal, Field, TextInput, SelectInput, SubmitButton } from "@/components/ui/modal";
import { createDeployment } from "@/lib/actions/deployments";
import { Rocket } from "lucide-react";
import type { Project } from "@/types/database";

interface Props {
  open: boolean;
  onClose: () => void;
  projects: Project[];
}

const envOptions = [
  { value: "Vercel", label: "▲ Vercel" },
  { value: "Railway", label: "🚂 Railway" },
  { value: "Alibaba", label: "☁️ Alibaba" },
  { value: "AWS", label: "🟧 AWS" },
  { value: "Other", label: "Other" },
];

export function DeploymentForm({ open, onClose, projects }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createDeployment(form);
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="New Deployment" icon={<Rocket className="w-4 h-4" />}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Project" name="project_id" required>
          <SelectInput name="project_id" required options={projects.map((p) => ({ value: p.id, label: p.name }))} />
        </Field>

        <Field label="Label" name="label" required>
          <TextInput name="label" required placeholder="Production API" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Environment" name="environment" required>
            <SelectInput name="environment" required options={envOptions} />
          </Field>
          <Field label="URL" name="url">
            <TextInput name="url" placeholder="https://app.example.com" />
          </Field>
        </div>

        {error && <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
        <SubmitButton label="Add Deployment" pending={pending} />
      </form>
    </Modal>
  );
}
