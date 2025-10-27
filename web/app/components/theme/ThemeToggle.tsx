'use client';
import { useEffect, useState } from 'react';

type Mode = 'light' | 'dark';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Mode>('light');

  // Lee el estado inicial desde el DOM (lo que SSR ya pintó) o cookie/localStorage si no hay clase
  useEffect(() => {
    const root = document.documentElement;
    const byClass = root.classList.contains('dark') ? 'dark' : 'light';
    let initial: Mode = byClass;

    // Si quieres priorizar preferencia guardada:
    try {
      const cookieMatch = document.cookie.match(/(?:^|;\s*)theme=(light|dark)/);
      const stored = (localStorage.getItem('theme') as Mode | null) || undefined;
      initial = (cookieMatch?.[1] as Mode) || stored || byClass;
    } catch { }
    setTheme(initial);
  }, []);

  function applyTheme(next: Mode) {
    const root = document.documentElement;
    root.classList.toggle('dark', next === 'dark');
    // Para inputs nativos, scrollbars, etc.
    try { root.style.colorScheme = next === 'dark' ? 'dark' : 'light'; } catch { }
  }

  function persistTheme(next: Mode) {
    // Cookie para que SSR la lea en el layout (usa ; Secure en prod HTTPS)
    document.cookie = `theme=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    try { localStorage.setItem('theme', next); } catch { }
  }

  function toggle() {
    const next: Mode = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    persistTheme(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label="Cambiar tema"
      className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border
                 bg-white text-slate-700 hover:bg-slate-50
                 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
      title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
    >
      <span className="text-base">{theme === 'dark' ? '🌙' : '☀️'}</span>
      <span className="hidden sm:inline">{theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
    </button>
  );
}
