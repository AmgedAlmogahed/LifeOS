"use client";

import { useState, useTransition } from "react";
import { Modal, Field, TextInput, TextArea, SelectInput, SubmitButton } from "@/components/ui/modal";
import { createPriceOffer, updatePriceOffer } from "@/lib/actions/price-offers";
import { DollarSign, Plus, Trash2 } from "lucide-react";
import type { Client, PriceOffer, Opportunity } from "@/types/database";

interface LineItem {
  name: string;
  service_type: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  clients: Client[];
  opportunities?: Opportunity[];
  editOffer?: PriceOffer | null;
}

const serviceOpts = [
  { value: "Cloud", label: "Cloud" },
  { value: "Web", label: "Web" },
  { value: "Design", label: "Design" },
  { value: "Marketing", label: "Marketing" },
];

const statusOpts = [
  { value: "Draft", label: "Draft" },
  { value: "Sent", label: "Sent" },
  { value: "Accepted", label: "✅ Accepted" },
  { value: "Rejected", label: "❌ Rejected" },
  { value: "Expired", label: "Expired" },
];

export function PriceOfferForm({ open, onClose, clients, opportunities, editOffer }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isEdit = !!editOffer;

  const [items, setItems] = useState<LineItem[]>(
    editOffer?.items ?? [{ name: "", service_type: "Web", description: "", quantity: 1, unit_price: 0, total: 0 }]
  );

  function addItem() {
    setItems([...items, { name: "", service_type: "Web", description: "", quantity: 1, unit_price: 0, total: 0 }]);
  }

  function removeItem(i: number) { setItems(items.filter((_, idx) => idx !== i)); }

  function updateItem(i: number, field: string, value: string | number) {
    const next = [...items];
    (next[i] as any)[field] = value;
    if (field === "quantity" || field === "unit_price") {
      next[i].total = next[i].quantity * next[i].unit_price;
    }
    setItems(next);
  }

  const total = items.reduce((s, i) => s + i.total, 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    form.set("items", JSON.stringify(items));
    form.set("total_value", String(total));

    startTransition(async () => {
      const result = isEdit
        ? await updatePriceOffer(editOffer!.id, form)
        : await createPriceOffer(form);
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  const currency = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Price Offer" : "New Price Offer"} icon={<DollarSign className="w-4 h-4" />} width="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Client" name="client_id" required>
            <SelectInput name="client_id" required options={clients.map((c) => ({ value: c.id, label: c.name }))} defaultValue={editOffer?.client_id} />
          </Field>

          <Field label="Linked Opportunity" name="opportunity_id">
            <SelectInput name="opportunity_id" options={(opportunities ?? []).map((o) => ({ value: o.id, label: o.title }))} defaultValue={editOffer?.opportunity_id ?? ""} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Title" name="title" required>
            <TextInput name="title" required placeholder="Q1 2026 — Cloud Setup" defaultValue={editOffer?.title} />
          </Field>
          {isEdit && (
            <Field label="Status" name="status">
              <SelectInput name="status" options={statusOpts} defaultValue={editOffer?.status} />
            </Field>
          )}
        </div>

        {/* ─── Line Items ──────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Line Items</span>
            <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
              <Plus className="w-3 h-3" /> Add Item
            </button>
          </div>

          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 bg-accent/20 rounded-lg border border-border/30">
              <div className="col-span-3">
                <label className="text-[9px] text-muted-foreground/60 uppercase">Name</label>
                <input value={item.name} onChange={(e) => updateItem(i, "name", e.target.value)}
                  className="w-full h-8 px-2 bg-accent/50 border border-border rounded text-xs text-foreground" placeholder="Service" />
              </div>
              <div className="col-span-2">
                <label className="text-[9px] text-muted-foreground/60 uppercase">Type</label>
                <select value={item.service_type} onChange={(e) => updateItem(i, "service_type", e.target.value)}
                  className="w-full h-8 px-2 bg-accent/50 border border-border rounded text-xs text-foreground">
                  {serviceOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-[9px] text-muted-foreground/60 uppercase">Qty</label>
                <input type="number" value={item.quantity} onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                  className="w-full h-8 px-2 bg-accent/50 border border-border rounded text-xs text-foreground" min={1} />
              </div>
              <div className="col-span-2">
                <label className="text-[9px] text-muted-foreground/60 uppercase">Unit $</label>
                <input type="number" value={item.unit_price} onChange={(e) => updateItem(i, "unit_price", Number(e.target.value))}
                  className="w-full h-8 px-2 bg-accent/50 border border-border rounded text-xs text-foreground" min={0} />
              </div>
              <div className="col-span-2">
                <label className="text-[9px] text-muted-foreground/60 uppercase">Total</label>
                <div className="h-8 px-2 flex items-center text-xs font-semibold text-foreground">{currency(item.total)}</div>
              </div>
              <div className="col-span-1 flex justify-end">
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)} className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-1">
            <span className="text-sm font-bold gradient-text-revenue">{currency(total)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Valid Until" name="valid_until">
            <TextInput name="valid_until" type="date" defaultValue={editOffer?.valid_until ?? ""} />
          </Field>
        </div>

        <Field label="Notes" name="notes">
          <TextArea name="notes" placeholder="Additional terms..." defaultValue={editOffer?.notes} />
        </Field>

        {error && <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
        <SubmitButton label={isEdit ? "Update Offer" : "Create Offer"} pending={pending} />
      </form>
    </Modal>
  );
}
