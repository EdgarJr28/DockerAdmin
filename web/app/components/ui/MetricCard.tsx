import { Card } from "./Card";
import Sparkline from "./SparkLine";


export default function MetricCard(
    { label, value, hint, series }:
        { label: string; value: string | number; hint?: string; series?: number[] }
) {
    return (
        <Card>
            <div className="text-xs text-slate-500">{label}</div>
            <div className="text-2xl font-semibold">{value}</div>
            {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
            {series && <div className="mt-2"><Sparkline data={series} /></div>}
        </Card>
    );
}
