"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { createInvoice, updateInvoice, recordPayment } from "@/lib/actions/finance";
import { toast } from "sonner";

interface InvoiceFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    clients: { id: string; name: string }[];
    projects: { id: string; name: string }[];
    editInvoice?: any; // null = create mode
}

const STATUSES = ["Pending", "Sent", "Paid", "Overdue", "Cancelled"] as const;

export function InvoiceFormModal({ isOpen, onClose, clients, projects, editInvoice }: InvoiceFormModalProps) {
    const [isPending, startTransition] = useTransition();
    const isEdit = !!editInvoice;

    const [form, setForm] = useState({
        client_id: editInvoice?.client_id || "",
        project_id: editInvoice?.project_id || "",
        amount: editInvoice?.amount?.toString() || "",
        status: editInvoice?.status || "Pending",
        due_date: editInvoice?.due_date?.split("T")[0] || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        pdf_url: editInvoice?.pdf_url || "",
    });

    const handleSubmit = () => {
        startTransition(async () => {
            try {
                if (isEdit) {
                    await updateInvoice(editInvoice.id, {
                        client_id: form.client_id || null,
                        project_id: form.project_id || null,
                        amount: parseFloat(form.amount),
                        status: form.status,
                        due_date: form.due_date,
                        pdf_url: form.pdf_url || null,
                    });
                    toast.success("Invoice updated");
                } else {
                    await createInvoice({
                        client_id: form.client_id || null,
                        project_id: form.project_id || null,
                        amount: parseFloat(form.amount),
                        status: form.status,
                        due_date: form.due_date,
                        pdf_url: form.pdf_url || null,
                    } as any);
                    toast.success("Invoice created");
                }
                onClose();
            } catch (err) {
                toast.error(`Failed to ${isEdit ? "update" : "create"} invoice`);
            }
        });
    };

    const handleMarkPaid = () => {
        if (!editInvoice) return;
        startTransition(async () => {
            try {
                await recordPayment({
                    invoice_id: editInvoice.id,
                    amount: editInvoice.amount,
                    paid_date: new Date().toISOString().split("T")[0],
                    method: "Bank Transfer",
                } as any);
                toast.success("Payment recorded");
                onClose();
            } catch (err) {
                toast.error("Failed to record payment");
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Invoice" : "New Invoice"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>Client</Label>
                            <Select value={form.client_id} onValueChange={(v) => setForm({...form, client_id: v})}>
                                <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
                                <SelectContent>
                                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>Project</Label>
                            <Select value={form.project_id} onValueChange={(v) => setForm({...form, project_id: v})}>
                                <SelectTrigger><SelectValue placeholder="Select project..." /></SelectTrigger>
                                <SelectContent>
                                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>Amount *</Label>
                            <Input type="number" step="0.01" value={form.amount}
                                   onChange={(e) => setForm({...form, amount: e.target.value})} placeholder="0.00" />
                        </div>
                        <div className="space-y-1">
                            <Label>Due Date</Label>
                            <Input type="date" value={form.due_date}
                                   onChange={(e) => setForm({...form, due_date: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <Label>Status</Label>
                            <Select value={form.status} onValueChange={(v) => setForm({...form, status: v})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>PDF URL</Label>
                            <Input value={form.pdf_url} onChange={(e) => setForm({...form, pdf_url: e.target.value})}
                                   placeholder="https://..." />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div>
                            {isEdit && editInvoice.status !== "Paid" && (
                                <Button variant="outline" size="sm" onClick={handleMarkPaid} disabled={isPending}
                                        className="text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10">
                                    Mark as Paid
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancel</Button>
                            <Button onClick={handleSubmit} disabled={isPending || !form.amount}>
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {isEdit ? "Update" : "Create"} Invoice
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
