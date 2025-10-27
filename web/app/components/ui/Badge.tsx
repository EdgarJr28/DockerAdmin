export default function Badge({ ok }: { ok: boolean }) {
    return (
        <span className={`inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full
      ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <span className={`h-2 w-2 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
            {ok ? 'Healthy' : 'Down'}
        </span>
    );
}
