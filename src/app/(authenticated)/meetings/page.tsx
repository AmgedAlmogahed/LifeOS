import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ListChecks } from "lucide-react";

export default async function MeetingsPage() {
    const supabase = await createClient();
    const { data: minutes } = await supabase.from("meeting_minutes").select("*, projects(name)").order("date", { ascending: false });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Meeting Minutes</h1>
            <div className="rounded-xl border bg-card text-card-foreground shadow">
                <div className="p-6">
                    {(minutes || []).length === 0 ? (
                        <div className="text-muted-foreground text-center py-8">No meeting minutes recorded.</div>
                    ) : (
                        <div className="space-y-4">
                            {(minutes || []).map((m: any) => (
                                <div key={m.id} className="flex flex-col gap-2 border-b border-border pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-foreground">{m.title}</h3>
                                        <span className="text-xs text-muted-foreground">{formatDate(m.date)}</span>
                                    </div>
                                    {m.projects && (
                                        <div className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded w-fit">
                                            {m.projects.name}
                                        </div>
                                    )}
                                    <p className="text-sm text-muted-foreground line-clamp-2">{m.summary_md}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
