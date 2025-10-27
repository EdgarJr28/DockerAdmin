import { Card } from "@/app/components/ui/Card";
import MetricCard from "@/app/components/ui/MetricCard";
import Progress from "@/app/components/ui/Progress";


export default function DashboardPage() {
    const cpu = [22, 27, 35, 29, 31, 33, 28];
    const mem = [60, 62, 61, 63, 65, 64, 66];
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <MetricCard label="Contenedores" value="12" hint="4 running / 8 stopped" series={[2, 3, 5, 7, 8, 9, 12]} />
                <MetricCard label="APIs ok" value="3 / 4" series={[2, 3, 3, 4, 3, 4, 3]} />
                <MetricCard label="Latencia p95" value="142 ms" series={[210, 180, 150, 142, 160, 155, 142]} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card>
                    <div className="text-sm text-slate-600 mb-2">CPU promedio</div>
                    <div className="flex items-center gap-4">
                        <Progress value={35} />
                        <span className="text-sm">35%</span>
                    </div>
                </Card>
                <Card>
                    <div className="text-sm text-slate-600 mb-2">Memoria</div>
                    <div className="flex items-center gap-4">
                        <Progress value={64} />
                        <span className="text-sm">64%</span>
                    </div>
                </Card>
            </div>
        </div>
    );
}
