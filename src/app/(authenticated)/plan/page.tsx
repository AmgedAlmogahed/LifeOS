import { getOrCreateDailyPlan } from "@/lib/actions/daily-plans";
import { format } from "date-fns";
import { PlanEditor } from "./plan-editor";

export default async function PlanPage() {
    const today = format(new Date(), "yyyy-MM-dd");
    const plan = await getOrCreateDailyPlan(today);
    
    return (
        <div className="container max-w-3xl py-8 px-4">
             <h1 className="text-2xl font-bold mb-2">Evening Plan</h1>
             <p className="text-muted-foreground mb-8">Reflect on today, prepare for tomorrow.</p>
             <PlanEditor initialPlan={plan} />
        </div>
    );
}
