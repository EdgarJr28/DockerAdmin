"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "../theme/ThemeToggle";
import ServerSelect from "../nav/ServerSelect";

function getSection(pathname: string) {
  const segs = pathname.split("/").filter(Boolean);
  const section = segs[1] || "dashboard";
  return section.charAt(0).toUpperCase() + section.slice(1);
}

export default function AppHeader() {
  const pathname = usePathname();
  const section = getSection(pathname || "/dashboard");
  const r = useRouter();

  const onLogout = () => {
    document.cookie = "auth=; Max-Age=0; path=/";
    r.replace("/login");
  };

  const userName = "Admin";
  const initials = userName
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b bg-white/80 dark:bg-slate-950/70 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-3">
        {/* Izquierda */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-slate-900 dark:text-slate-100"
          >
            <div className="h-8 w-8 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 grid place-items-center text-lg font-bold leading-none">
              🐳
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">
                Docker Admin
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                {section}
              </p>
            </div>
          </Link>
        </div>

        {/* Centro SOLO en md+ */}
        <div className="pointer-events-none absolute inset-0 hidden md:flex items-center justify-center">
          <div className="pointer-events-auto w-[260px] max-w-[60vw]">
            <ServerSelect />
          </div>
        </div>

        {/* Derecha */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-3">
          <ThemeToggle />

          {/* Menú usuario */}
          <div className="relative">
            <details className="group">
              <summary className="list-none">
                <div
                  role="button"
                  className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 grid place-items-center text-xs font-semibold cursor-pointer text-slate-900 dark:text-slate-100"
                  title={userName}
                >
                  {initials}
                </div>
              </summary>

              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200/50 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {userName}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    admin@example.com
                  </div>
                </div>

                <div className="p-1">
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/services"
                    className="block px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Servicios
                  </Link>
                  <Link
                    href="/apis"
                    className="block px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    APIs
                  </Link>
                  <Link
                    href="/user-hosts"
                    className="block px-3 py-2 rounded-lg text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    title="Administrar servidores Docker"
                  >
                    Gestión de Hosts
                  </Link>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 p-1">
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* En mobile, solo este */}
      <div className="md:hidden border-t border-slate-200/50 dark:border-slate-800 px-4 pb-3">
        <div className="pt-3">
          <ServerSelect />
        </div>
      </div>
    </header>
  );
}
