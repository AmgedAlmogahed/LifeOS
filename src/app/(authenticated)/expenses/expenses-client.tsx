"use client";

import { useState, useTransition } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Receipt, RefreshCw, Trash2, Loader2 } from "lucide-react";
import { createExpense, deleteExpense, createRecurringExpense } from "@/lib/actions/expenses";
import { toast } from "sonner";
import type { ExpenseCategory, RecurringFrequency } from "@/types/database";

const CATEGORIES: ExpenseCategory[] = [
    "Infrastructure", "Tools", "Subscriptions", "Office", "Travel",
    "Contractor", "Marketing", "Legal", "Other"
];

const CATEGORY_COLORS: Record<string, string> = {
    Infrastructure: "bg-blue-500",
    Tools: "bg-green-500",
    Subscriptions: "bg-purple-500",
    Office: "bg-amber-500",
    Travel: "bg-cyan-500",
    Contractor: "bg-pink-500",
    Marketing: "bg-orange-500",
    Legal: "bg-red-500",
    Other: "bg-gray-500",
};

interface ExpensesClientProps {
    expenses: any[];
    recurringExpenses: any[];
    projects: { id: string; name: string }[];
    totalThisMonth: number;
    totalVatThisMonth: number;
    recurringMonthly: number;
    byCategory: Record<string, number>;
}

export function ExpensesClient({
    expenses,
    recurringExpenses,
    projects,
    totalThisMonth,
    totalVatThisMonth,
    recurringMonthly,
    byCategory,
}: ExpensesClientProps) {
    const [isPending, startTransition] = useTransition();
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [showAddRecurring, setShowAddRecurring] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState<string>("all");

    // Form state
    const [form, setForm] = useState({
        description: "", amount: "", vat_amount: "", category: "Other" as ExpenseCategory,
        vendor_name: "", expense_date: new Date().toISOString().split("T")[0],
        project_id: "", receipt_url: "", notes: "",
    });

    const [recurringForm, setRecurringForm] = useState({
        name: "", amount: "", vat_amount: "", category: "Subscriptions" as ExpenseCategory,
        vendor_name: "", frequency: "monthly" as RecurringFrequency,
        next_due_date: "", notes: "",
    });

    const handleAddExpense = () => {
        startTransition(async () => {
            try {
                await createExpense({
                    description: form.description,
                    amount: parseFloat(form.amount),
                    vat_amount: parseFloat(form.vat_amount || "0"),
                    category: form.category,
                    vendor_name: form.vendor_name,
                    expense_date: form.expense_date,
                    project_id: form.project_id || null,
                    receipt_url: form.receipt_url,
                    notes: form.notes,
                    is_recurring: false,
                });
                toast.success("Expense added");
                setShowAddExpense(false);
                setForm({
                    description: "", amount: "", vat_amount: "", category: "Other",
                    vendor_name: "", expense_date: new Date().toISOString().split("T")[0],
                    project_id: "", receipt_url: "", notes: "",
                });
            } catch (err) {
                toast.error("Failed to add expense");
            }
        });
    };

    const handleAddRecurring = () => {
        startTransition(async () => {
            try {
                await createRecurringExpense({
                    name: recurringForm.name,
                    amount: parseFloat(recurringForm.amount),
                    vat_amount: parseFloat(recurringForm.vat_amount || "0"),
                    category: recurringForm.category,
                    vendor_name: recurringForm.vendor_name,
                    frequency: recurringForm.frequency,
                    next_due_date: recurringForm.next_due_date || null,
                    is_active: true,
                    notes: recurringForm.notes,
                });
                toast.success("Recurring expense added");
                setShowAddRecurring(false);
            } catch (err) {
                toast.error("Failed to add recurring expense");
            }
        });
    };

    const handleDeleteExpense = (id: string) => {
        startTransition(async () => {
            try {
                await deleteExpense(id);
                toast.success("Expense deleted");
            } catch (err) {
                toast.error("Failed to delete");
            }
        });
    };

    const filteredExpenses = categoryFilter === "all"
        ? expenses
        : expenses.filter((e: any) => e.category === categoryFilter);

    const maxCategoryAmount = Math.max(...Object.values(byCategory), 1);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Expenses</h1>
                <Button onClick={() => setShowAddExpense(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> Add Expense
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-card shadow p-6">
                    <h3 className="text-sm font-medium text-muted-foreground">This Month</h3>
                    <div className="text-2xl font-bold mt-2 text-foreground">{formatCurrency(totalThisMonth)}</div>
                    <p className="text-xs text-muted-foreground mt-1">VAT: {formatCurrency(totalVatThisMonth)}</p>
                </div>
                <div className="rounded-xl border bg-card shadow p-6">
                    <h3 className="text-sm font-medium text-muted-foreground">Recurring (Monthly)</h3>
                    <div className="text-2xl font-bold mt-2 text-amber-500">{formatCurrency(recurringMonthly)}</div>
                    <p className="text-xs text-muted-foreground mt-1">{recurringExpenses.length} active subscriptions</p>
                </div>
                <div className="rounded-xl border bg-card shadow p-6">
                    <h3 className="text-sm font-medium text-muted-foreground">By Category</h3>
                    <div className="space-y-2 mt-3">
                        {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([cat, amount]) => (
                            <div key={cat} className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[cat] || "bg-gray-400"}`} />
                                <span className="text-xs text-muted-foreground flex-1">{cat}</span>
                                <span className="text-xs font-mono text-foreground">{formatCurrency(amount)}</span>
                                <div className="w-16 bg-muted rounded-full h-1.5">
                                    <div className={`h-full rounded-full ${CATEGORY_COLORS[cat] || "bg-gray-400"}`}
                                         style={{ width: `${(amount / maxCategoryAmount) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="expenses">
                <TabsList>
                    <TabsTrigger value="expenses" className="gap-1.5">
                        <Receipt className="w-4 h-4" /> Expenses
                    </TabsTrigger>
                    <TabsTrigger value="recurring" className="gap-1.5">
                        <RefreshCw className="w-4 h-4" /> Recurring
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="expenses" className="space-y-4">
                    {/* Category filter */}
                    <div className="flex gap-2 flex-wrap">
                        <Button variant={categoryFilter === "all" ? "secondary" : "ghost"} size="sm"
                                onClick={() => setCategoryFilter("all")}>
                            All
                        </Button>
                        {CATEGORIES.map(cat => (
                            <Button key={cat} variant={categoryFilter === cat ? "secondary" : "ghost"} size="sm"
                                    onClick={() => setCategoryFilter(cat)}>
                                {cat}
                            </Button>
                        ))}
                    </div>

                    {/* Expense table */}
                    <div className="rounded-xl border bg-card shadow overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Date</th>
                                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Description</th>
                                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Vendor</th>
                                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Category</th>
                                    <th className="h-10 px-4 text-right font-medium text-muted-foreground">Amount</th>
                                    <th className="h-10 px-4 text-right font-medium text-muted-foreground">VAT</th>
                                    <th className="h-10 px-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.map((exp: any) => (
                                    <tr key={exp.id} className="border-b hover:bg-muted/30 transition-colors">
                                        <td className="p-4 text-muted-foreground">{formatDate(exp.expense_date)}</td>
                                        <td className="p-4 font-medium text-foreground">{exp.description}</td>
                                        <td className="p-4 text-muted-foreground">{exp.vendor_name || "—"}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[exp.category] || "bg-gray-500"}/10 text-foreground`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${CATEGORY_COLORS[exp.category] || "bg-gray-400"}`} />
                                                {exp.category}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-mono text-foreground">{formatCurrency(exp.amount)}</td>
                                        <td className="p-4 text-right font-mono text-muted-foreground">{formatCurrency(exp.vat_amount || 0)}</td>
                                        <td className="p-4">
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500"
                                                    onClick={() => handleDeleteExpense(exp.id)} disabled={isPending}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredExpenses.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                            No expenses found. Click "Add Expense" to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </TabsContent>

                <TabsContent value="recurring" className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={() => setShowAddRecurring(true)} size="sm" variant="outline" className="gap-1.5">
                            <Plus className="w-4 h-4" /> Add Recurring
                        </Button>
                    </div>

                    <div className="grid gap-3">
                        {recurringExpenses.map((r: any) => (
                            <div key={r.id} className="rounded-xl border bg-card shadow p-4 flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${CATEGORY_COLORS[r.category] || "bg-gray-500"}/10`}>
                                    <RefreshCw className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-foreground text-sm">{r.name}</h4>
                                    <p className="text-xs text-muted-foreground">{r.vendor_name} • {r.frequency}</p>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono font-medium text-foreground">{formatCurrency(r.amount)}</div>
                                    {r.next_due_date && (
                                        <span className="text-xs text-muted-foreground">Due: {formatDate(r.next_due_date)}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {recurringExpenses.length === 0 && (
                            <p className="text-center text-muted-foreground py-8 text-sm">No recurring expenses set up.</p>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Add Expense Modal */}
            <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add Expense</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2 space-y-1">
                                <Label>Description *</Label>
                                <Input value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="e.g. Server hosting" />
                            </div>
                            <div className="space-y-1">
                                <Label>Amount *</Label>
                                <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} placeholder="0.00" />
                            </div>
                            <div className="space-y-1">
                                <Label>VAT Amount</Label>
                                <Input type="number" step="0.01" value={form.vat_amount} onChange={(e) => setForm({...form, vat_amount: e.target.value})} placeholder="0.00" />
                            </div>
                            <div className="space-y-1">
                                <Label>Category</Label>
                                <Select value={form.category} onValueChange={(v) => setForm({...form, category: v as ExpenseCategory})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label>Date</Label>
                                <Input type="date" value={form.expense_date} onChange={(e) => setForm({...form, expense_date: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <Label>Vendor</Label>
                                <Input value={form.vendor_name} onChange={(e) => setForm({...form, vendor_name: e.target.value})} placeholder="e.g. AWS" />
                            </div>
                            <div className="space-y-1">
                                <Label>Project (optional)</Label>
                                <Select value={form.project_id} onValueChange={(v) => setForm({...form, project_id: v})}>
                                    <SelectTrigger><SelectValue placeholder="No project" /></SelectTrigger>
                                    <SelectContent>
                                        {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2 space-y-1">
                                <Label>Notes</Label>
                                <Textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="resize-none min-h-[60px]" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setShowAddExpense(false)}>Cancel</Button>
                            <Button onClick={handleAddExpense} disabled={isPending || !form.description || !form.amount}>
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Add Expense
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Recurring Modal */}
            <Dialog open={showAddRecurring} onOpenChange={setShowAddRecurring}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add Recurring Expense</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2 space-y-1">
                                <Label>Name *</Label>
                                <Input value={recurringForm.name} onChange={(e) => setRecurringForm({...recurringForm, name: e.target.value})} placeholder="e.g. GitHub Pro" />
                            </div>
                            <div className="space-y-1">
                                <Label>Amount *</Label>
                                <Input type="number" step="0.01" value={recurringForm.amount} onChange={(e) => setRecurringForm({...recurringForm, amount: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <Label>Frequency</Label>
                                <Select value={recurringForm.frequency} onValueChange={(v) => setRecurringForm({...recurringForm, frequency: v as RecurringFrequency})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="quarterly">Quarterly</SelectItem>
                                        <SelectItem value="yearly">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label>Category</Label>
                                <Select value={recurringForm.category} onValueChange={(v) => setRecurringForm({...recurringForm, category: v as ExpenseCategory})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label>Vendor</Label>
                                <Input value={recurringForm.vendor_name} onChange={(e) => setRecurringForm({...recurringForm, vendor_name: e.target.value})} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setShowAddRecurring(false)}>Cancel</Button>
                            <Button onClick={handleAddRecurring} disabled={isPending || !recurringForm.name || !recurringForm.amount}>
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Add Recurring
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
