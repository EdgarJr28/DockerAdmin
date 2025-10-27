'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ClientOnly from '../common/ClientOnly';
import ThemeToggle from '../theme/ThemeToggle';

function getSection(pathname: string) {
    const segs = pathname.split('/').filter(Boolean); // ['board','dashboard', ...]
    const section = segs[1] || 'dashboard';
    return section.charAt(0).toUpperCase() + section.slice(1);
}

export default function AppHeader() {
    const pathname = usePathname();
    const section = getSection(pathname || '/dashboard');

    const r = useRouter();
    const onLogout = () => {
        document.cookie = 'auth=; Max-Age=0; path=/';
        r.replace('/login');
    };

    const userName = 'Admin';
    const initials = userName.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

    return (
        <header className="surface border-b bg-white sticky top-0 z-30">
            <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-6">
                {/* Logo Ludycom */}
                <div className="flex items-center gap-3">
                    <Link href="/dashboard" className="inline-flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg text-white grid place-items-center font-bold text-xl animate-pulse duration-600">🐳</div>
                        <span className="text-lg font-semibold tracking-tight">Docker Admin </span>
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    {/* Pill SOLO en cliente */}
  {/*                   <ClientOnly>
                        <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs bg-slate-100 text-slate-700">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            {section}
                        </span>
                    </ClientOnly> */}
                    <ThemeToggle />
                    {/* Perfil (queda SSR) */}
                    <div className="relative">
                        <details className="group">
                            <summary className="list-none">
                                <div
                                    role="button"
                                    className="h-9 w-9 rounded-full bg-slate-200 grid place-items-center text-xs font-semibold cursor-pointer"
                                    title={userName}
                                >
                                    {initials}
                                </div>
                            </summary>
                            <div className="surface absolute right-0 mt-2 w-56 rounded-xl border bg-white shadow-lg z-20">
                                <div className="px-4 py-3 border-b">
                                    <div className="text-sm font-medium">{userName}</div>
                                    <div className="text-xs text-slate-500">admin@example.com</div>
                                </div>
                                <div className="p-1">
                                    <Link href="/dashboard" className="block px-3 py-2 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700">Dashboard</Link>
                                    <Link href="/services" className="block px-3 py-2 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700">Servicios</Link>
                                    <Link href="/apis" className="block px-3 py-2 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700">APIs</Link>
                                </div>
                                <div className="border-t p-1">
                                    <button onClick={onLogout} className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-100">
                                        Cerrar sesión
                                    </button>
                                </div>
                            </div>
                        </details>
                    </div>
                </div>
            </div>
        </header>
    );
}
