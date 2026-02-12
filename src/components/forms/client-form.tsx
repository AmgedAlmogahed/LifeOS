"use client";

import { useState, useTransition } from "react";
import { Modal, Field, TextInput, TextArea, ColorInput, SubmitButton } from "@/components/ui/modal";
import { createClientAction, updateClientAction } from "@/lib/actions/clients";
import { Users } from "lucide-react";
import type { Client } from "@/types/database";

interface Props {
  open: boolean;
  onClose: () => void;
  editClient?: Client | null;
}

export function ClientForm({ open, onClose, editClient }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isEdit = !!editClient;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = isEdit
        ? await updateClientAction(editClient!.id, form)
        : await createClientAction(form);

      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Client" : "New Client"} icon={<Users className="w-4 h-4" />}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Company Name" name="name" required>
          <TextInput name="name" required placeholder="Acme Corp" defaultValue={editClient?.name} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Email" name="email">
            <TextInput name="email" type="email" placeholder="hello@acme.com" defaultValue={editClient?.email} />
          </Field>
          <Field label="Phone" name="phone">
            <TextInput name="phone" placeholder="+1 555 000 0000" defaultValue={editClient?.phone} />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Brand Primary" name="brand_primary">
            <ColorInput name="brand_primary" defaultValue={editClient?.brand_primary || "#6366f1"} />
          </Field>
          <Field label="Brand Secondary" name="brand_secondary">
            <ColorInput name="brand_secondary" defaultValue={editClient?.brand_secondary || "#8b5cf6"} />
          </Field>
          <Field label="Brand Accent" name="brand_accent">
            <ColorInput name="brand_accent" defaultValue={editClient?.brand_accent || "#06b6d4"} />
          </Field>
        </div>

        <Field label="Logo URL" name="logo_url">
          <TextInput name="logo_url" placeholder="https://..." defaultValue={editClient?.logo_url} />
        </Field>

        <Field label="Brand Assets URL" name="brand_assets_url">
          <TextInput name="brand_assets_url" placeholder="https://drive.google.com/..." defaultValue={editClient?.brand_assets_url} />
        </Field>

        <Field label="Notes" name="notes">
          <TextArea name="notes" placeholder="Internal notes about this client..." defaultValue={editClient?.notes} />
        </Field>

        {error && <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
        <SubmitButton label={isEdit ? "Update Client" : "Create Client"} pending={pending} />
      </form>
    </Modal>
  );
}
