import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { MessageSquare, Phone, Mail, User } from "lucide-react";

const channelIcons: Record<string, any> = {
    Email: <Mail className="w-4 h-4" />,
    Call: <Phone className="w-4 h-4" />,
    Meeting: <User className="w-4 h-4" />,
    WhatsApp: <MessageSquare className="w-4 h-4" />,
};

export default async function CommsPage() {
    const supabase = await createClient();
    const { data: logs } = await supabase.from("communication_logs").select("*, clients(name)").order("timestamp", { ascending: false });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Communications Log</h1>
            <div className="rounded-xl border bg-card text-card-foreground shadow">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b border-border">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-32">Date</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-40">Client</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-20">Type</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Summary</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-24">Sentiment</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {(logs || []).length === 0 ? (
                                <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No logs found.</td></tr>
                            ) : 
                            (logs || []).map((log: any) => (
                                <tr key={log.id} className="border-b transition-colors hover:bg-muted/50 border-border">
                                    <td className="p-4 align-middle text-muted-foreground text-xs whitespace-nowrap">{formatDate(log.timestamp)}</td>
                                    <td className="p-4 align-middle font-medium text-foreground">{log.clients?.name}</td>
                                    <td className="p-4 align-middle">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            {channelIcons[log.channel] || <MessageSquare className="w-3 h-3" />}
                                            {log.channel}
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle text-foreground/90">{log.summary}</td>
                                    <td className="p-4 align-middle">
                                        {/* Simple sentiment bar */}
                                        <div className="w-full bg-accent h-1.5 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${
                                                    (log.sentiment_score ?? 0.5) > 0.6 ? "bg-emerald-500" :
                                                    (log.sentiment_score ?? 0.5) < 0.4 ? "bg-red-500" : "bg-amber-500"
                                                }`} 
                                                style={{ width: `${(log.sentiment_score ?? 0.5) * 100}%` }} 
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
