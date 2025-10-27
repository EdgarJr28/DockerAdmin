import Link from 'next/link';
import ContainerActions from './ContainerActions';
import { getName, shortId } from '@/app/libs/utils';


export default function ContainerCard({
    c,
    onOp,
}: {
    c: any;
    onOp: (id: string, op: 'start' | 'stop' | 'restart') => Promise<void>;
}) {
    const name = getName(c);
    const isRunning = (c.State || '').toLowerCase() === 'running';

    return (
        <div className="surface bg-white rounded-xl border p-4 flex items-center justify-between">
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${isRunning ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div className="font-semibold truncate">{name}</div>
                </div>
                <div className="text-sm text-slate-600 truncate">{c.Image}</div>
                <div className="text-xs text-slate-500">Estado: {c.State} — {c.Status}</div>

                <div className="mt-2 flex items-center gap-3 text-xs">
                    <Link href={`/containers/${c.Id}/logs?name=${encodeURIComponent(name)}`} className="underline">
                        Ver logs
                    </Link>
                    <span className="text-slate-400 font-mono">ID: {shortId(c.Id)}</span>
                </div>
            </div>

            <div className="shrink-0">
                <ContainerActions
                    isRunning={isRunning}
                    onAction={(op) => onOp(c.Id, op)}
                />
            </div>
        </div>
    );
}
