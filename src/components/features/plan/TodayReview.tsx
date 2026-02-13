
import { CheckCircle2, Clock, PlayCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface TodayReviewProps {
    stats: {
        completed: number;
        inProgress: number;
        focusMinutes: number;
    };
}

export function TodayReview({ stats }: TodayReviewProps) {
    const hours = Math.floor(stats.focusMinutes / 60);
    const minutes = stats.focusMinutes % 60;
    const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    return (
        <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
                📊 Today's Review
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-green-500/5 border-green-500/10">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-full text-green-500">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{stats.completed}</div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Completed</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-blue-500/5 border-blue-500/10">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-full text-blue-500">
                            <PlayCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{stats.inProgress}</div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">In Progress</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-purple-500/5 border-purple-500/10">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-full text-purple-500">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{timeString}</div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Focus Time</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}
