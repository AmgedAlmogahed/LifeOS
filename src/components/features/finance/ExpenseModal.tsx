"use client";

import { useState } from "react";
import { DollarSign, Receipt, Calendar, Building, Briefcase, Tag } from "lucide-react";
import { Modal, Field, TextInput, SelectInput, SubmitButton, TextArea } from "@/components/ui/modal";
import { createExpense, updateExpense } from "@/lib/actions/expenses";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingExpense?: any;
  projects: any[];
  accounts: any[];
  defaultAccountId?: string;
}

const CATEGORIES = [
  "Infrastructure", "Tools", "Subscriptions", "Office", "Travel", "Contractor", "Marketing", "Legal", "Other"
];

export function ExpenseModal({ 
  isOpen, 
  onClose, 
  editingExpense, 
  projects, 
  accounts, 
  defaultAccountId 
}: ExpenseModalProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      description: formData.get("description") as string,
      amount: parseFloat(formData.get("amount") as string),
      vat_amount: parseFloat(formData.get("vat_amount") as string) || 0,
      category: formData.get("category") as string,
      vendor_name: formData.get("vendor_name") as string,
      expense_date: formData.get("expense_date") as string,
      project_id: formData.get("project_id") as string || null,
      account_id: formData.get("account_id") as string,
      notes: formData.get("notes") as string,
    };

    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, data as any);
        toast.success("Expense updated");
      } else {
        await createExpense(data as any);
        toast.success("Expense created");
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
      title={editingExpense ? "Edit Expense" : "Log New Expense"}
      icon={<Receipt className="w-5 h-5" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Description" name="description" required>
          <TextInput name="description" required placeholder="e.g. AWS Monthly Bill" defaultValue={editingExpense?.description} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Total Amount" name="amount" required>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input 
                name="amount" 
                type="number" 
                step="0.01" 
                required 
                className="w-full h-9 pl-9 pr-3 bg-accent/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                defaultValue={editingExpense?.amount}
              />
            </div>
          </Field>
          <Field label="VAT (Included)" name="vat_amount">
             <div className="relative">
              <Tag className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input 
                name="vat_amount" 
                type="number" 
                step="0.01" 
                className="w-full h-9 pl-9 pr-3 bg-accent/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                defaultValue={editingExpense?.vat_amount || 0}
              />
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category" name="category" required>
            <SelectInput 
              name="category" 
              required 
              options={CATEGORIES.map(c => ({ value: c, label: c }))}
              defaultValue={editingExpense?.category || "Infrastructure"}
            />
          </Field>
          <Field label="Date" name="expense_date" required>
            <TextInput name="expense_date" type="date" required defaultValue={editingExpense?.expense_date?.split('T')[0] || new Date().toISOString().split('T')[0]} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Vendor" name="vendor_name" required>
            <TextInput name="vendor_name" required placeholder="Google, Amazon, etc." defaultValue={editingExpense?.vendor_name} />
          </Field>
          <Field label="Entity (Account)" name="account_id" required>
            <SelectInput 
              name="account_id" 
              required 
              options={accounts.map(a => ({ value: a.id, label: a.name }))}
              defaultValue={editingExpense?.account_id || defaultAccountId}
            />
          </Field>
        </div>

        <Field label="Related Project (Optional)" name="project_id">
          <SelectInput 
            name="project_id" 
            options={projects.map(p => ({ value: p.id, label: p.name }))}
            defaultValue={editingExpense?.project_id}
          />
        </Field>

        <Field label="Notes" name="notes">
          <TextArea name="notes" placeholder="Additional details..." defaultValue={editingExpense?.notes} />
        </Field>

        <SubmitButton label={editingExpense ? "Update Expense" : "Log Expense"} pending={isPending} />
      </form>
    </Modal>
  );
}
