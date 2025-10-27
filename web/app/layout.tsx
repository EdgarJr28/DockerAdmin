import AppFooter from './components/layout/AppFooter';
import AppHeader from './components/layout/AppHeader';
import FabRadialNav from './components/layout/FabRadialNav';
import ThemeColorScript from './components/theme/ThemeColorScript';

import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Docker Board',
  description: 'Dashboard de servicios y APIs',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // 👇 NO pongas className ni style de tema aquí
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* El script aplica .dark/.light ANTES de hidratar */}
        <ThemeColorScript />
        {/* Meta opcional para status bar (el script puede actualizarla luego) */}
        <meta name="theme-color" content="#f8fafc" />
      </head>
      {/* Usa tus vars: nada de bg-slate-50/text-slate-900 fijos */}
      <body className="min-h-screen flex flex-col text-main">
        <AppHeader />
        <main className="max-w-6xl mx-auto px-6 py-6 flex-1">{children}</main>
        <AppFooter />
        <FabRadialNav />
      </body>
    </html>
  );
}
