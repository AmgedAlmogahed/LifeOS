"use client";

import { useState, useTransition } from "react";
import { Modal, Field, TextInput, TextArea, SelectInput, SubmitButton } from "@/components/ui/modal";
import { createContract, updateContract } from "@/lib/actions/contracts";
import { FileText } from "lucide-react";
import type { Client, Contract } from "@/types/database";

interface Props {
  open: boolean;
  onClose: () => void;
  clients: Client[];
  editContract?: Contract | null;
}

const statusOpts = [
  { value: "Draft", label: "Draft" },
  { value: "Pending Signature", label: "Pending Signature" },
  { value: "Active", label: "✅ Active" },
  { value: "Completed", label: "Completed" },
  { value: "Terminated", label: "❌ Terminated" },
];

export function ContractForm({ open, onClose, clients, editContract }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isEdit = !!editContract;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = isEdit
        ? await updateContract(editContract!.id, form)
        : await createContract(form);
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Contract" : "New Contract"} icon={<FileText className="w-4 h-4" />}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Client" name="client_id" required>
          <SelectInput name="client_id" required options={clients.map((c) => ({ value: c.id, label: c.name }))} defaultValue={editContract?.client_id} />
        </Field>

        <Field label="Title" name="title" required>
          <TextInput name="title" required placeholder="Q1 2026 — Full Stack Build" defaultValue={editContract?.title} />
        </Field>

        {isEdit && (
          <Field label="Status" name="status">
            <SelectInput name="status" options={statusOpts} defaultValue={editContract?.status} />
          </Field>
        )}

        <Field label="Total Value ($)" name="total_value">
          <TextInput name="total_value" type="number" placeholder="25000" defaultValue={String(editContract?.total_value ?? "")} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Start Date" name="start_date">
            <TextInput name="start_date" type="date" defaultValue={editContract?.start_date ?? ""} />
          </Field>
          <Field label="End Date" name="end_date">
            <TextInput name="end_date" type="date" defaultValue={editContract?.end_date ?? ""} />
          </Field>
        </div>

        <Field label="PDF URL" name="pdf_url">
          <TextInput name="pdf_url" placeholder="https://..." defaultValue={editContract?.pdf_url ?? ""} />
        </Field>

        <Field label="Terms (Markdown)" name="terms_md">
          <TextArea name="terms_md" rows={6} placeholder="# Contract Terms\n\n..." defaultValue={editContract?.terms_md ?? ""} />
        </Field>

        {error && <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
        <SubmitButton label={isEdit ? "Update Contract" : "Create Contract"} pending={pending} />
      </form>
    </Modal>
  );
}
