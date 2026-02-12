"use client";

import { useState, useTransition } from "react";
import { Modal, Field, TextInput, TextArea, SelectInput, SubmitButton } from "@/components/ui/modal";
import { createOpportunity, updateOpportunity } from "@/lib/actions/opportunities";
import { TrendingUp } from "lucide-react";
import type { Client, Opportunity } from "@/types/database";

interface Props {
  open: boolean;
  onClose: () => void;
  clients: Client[];
  editOpp?: Opportunity | null;
}

const serviceTypes = [
  { value: "Cloud", label: "☁️ Cloud" },
  { value: "Web", label: "🌐 Web" },
  { value: "Design", label: "🎨 Design" },
  { value: "Marketing", label: "📣 Marketing" },
];

const stages = [
  { value: "Draft", label: "Draft" },
  { value: "Price Offer Sent", label: "Price Offer Sent" },
  { value: "Negotiating", label: "Negotiating" },
  { value: "Won", label: "✅ Won" },
  { value: "Lost", label: "❌ Lost" },
];

export function OpportunityForm({ open, onClose, clients, editOpp }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isEdit = !!editOpp;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = isEdit
        ? await updateOpportunity(editOpp!.id, form)
        : await createOpportunity(form);

      if (result.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Opportunity" : "New Opportunity"} icon={<TrendingUp className="w-4 h-4" />}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Client" name="client_id" required>
          <SelectInput name="client_id" required options={clients.map((c) => ({ value: c.id, label: c.name }))} defaultValue={editOpp?.client_id} />
        </Field>

        <Field label="Title" name="title" required>
          <TextInput name="title" required placeholder="Cloud Migration Phase 2" defaultValue={editOpp?.title} />
        </Field>

        <Field label="Description" name="description">
          <TextArea name="description" placeholder="Scope and context..." defaultValue={editOpp?.description} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Service Type" name="service_type" required>
            <SelectInput name="service_type" required options={serviceTypes} defaultValue={editOpp?.service_type} />
          </Field>
          {isEdit && (
            <Field label="Stage" name="stage">
              <SelectInput name="stage" options={stages} defaultValue={editOpp?.stage} />
            </Field>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Est. Value ($)" name="estimated_value">
            <TextInput name="estimated_value" type="number" placeholder="10000" defaultValue={String(editOpp?.estimated_value ?? "")} />
          </Field>
          <Field label="Probability (%)" name="probability">
            <TextInput name="probability" type="number" placeholder="50" defaultValue={String(editOpp?.probability ?? "")} />
          </Field>
          <Field label="Expected Close" name="expected_close">
            <TextInput name="expected_close" type="date" defaultValue={editOpp?.expected_close ?? ""} />
          </Field>
        </div>

        {error && <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
        <SubmitButton label={isEdit ? "Update Opportunity" : "Create Opportunity"} pending={pending} />
      </form>
    </Modal>
  );
}
