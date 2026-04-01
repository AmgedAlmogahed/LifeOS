"use client";

import { useState } from "react";
import { DollarSign, FileText, Calendar, Building, Briefcase } from "lucide-react";
import { Modal, Field, TextInput, SelectInput, SubmitButton } from "@/components/ui/modal";
import { createInvoice, updateInvoice } from "@/lib/actions/finance";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingInvoice?: any;
  clients: any[];
  projects: any[];
  accounts: any[];
  defaultAccountId?: string;
}

export function InvoiceModal({ 
  isOpen, 
  onClose, 
  editingInvoice, 
  clients, 
  projects, 
  accounts, 
  defaultAccountId 
}: InvoiceModalProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      invoice_number: formData.get("invoice_number") as string,
      client_id: formData.get("client_id") as string,
      project_id: formData.get("project_id") as string || null,
      account_id: formData.get("account_id") as string,
      amount: parseFloat(formData.get("amount") as string),
      status: formData.get("status") as any || "Pending",
      due_date: formData.get("due_date") as string,
      notes: formData.get("notes") as string,
    };

    try {
      if (editingInvoice) {
        await updateInvoice(editingInvoice.id, data);
        toast.success("Invoice updated");
      } else {
        await createInvoice(data as any);
        toast.success("Invoice created");
      }
      onClose();
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Modal 
      open={isOpen} 
      onClose={onClose} 
      title={editingInvoice ? "Edit Invoice" : "Generate New Invoice"}
      icon={<FileText className="w-5 h-5" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Invoice #" name="invoice_number" required>
            <TextInput name="invoice_number" required placeholder="INV-001" defaultValue={editingInvoice?.invoice_number} />
          </Field>
          <Field label="Amount" name="amount" required>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input 
                name="amount" 
                type="number" 
                step="0.01" 
                required 
                className="w-full h-9 pl-9 pr-3 bg-accent/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                defaultValue={editingInvoice?.amount}
              />
            </div>
          </Field>
        </div>

        <Field label="Filing Entity (Account)" name="account_id" required>
          <SelectInput 
            name="account_id" 
            required 
            options={accounts.map(a => ({ value: a.id, label: a.name }))}
            defaultValue={editingInvoice?.account_id || defaultAccountId}
          />
        </Field>

        <Field label="Client" name="client_id" required>
          <SelectInput 
            name="client_id" 
            required 
            options={clients.map(c => ({ value: c.id, label: c.name }))}
            defaultValue={editingInvoice?.client_id}
          />
        </Field>

        <Field label="Related Project (Optional)" name="project_id">
          <SelectInput 
            name="project_id" 
            options={projects.map(p => ({ value: p.id, label: p.name }))}
            defaultValue={editingInvoice?.project_id}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Due Date" name="due_date" required>
            <TextInput name="due_date" type="date" required defaultValue={editingInvoice?.due_date?.split('T')[0]} />
          </Field>
          <Field label="Initial Status" name="status">
            <SelectInput 
              name="status" 
              options={[
                { value: "Pending", label: "Pending" },
                { value: "Sent", label: "Sent" },
                { value: "Paid", label: "Paid" },
                { value: "Cancelled", label: "Cancelled" }
              ]}
              defaultValue={editingInvoice?.status || "Pending"}
            />
          </Field>
        </div>

        <SubmitButton label={editingInvoice ? "Update Invoice" : "Create Invoice"} pending={isPending} />
      </form>
    </Modal>
  );
}
