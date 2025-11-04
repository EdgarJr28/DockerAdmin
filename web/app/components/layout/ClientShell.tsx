"use client";

import { useEffect } from "react";
import { useAuthClient } from "@/app/hooks/useAuthClient";
import AppHeader from "./AppHeader";
import AppFooter from "./AppFooter";
import FabRadialNav from "./FabRadialNav";
import ToastContainer from "@/app/components/ui/ToastContainer";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  // tu hook, tal como lo tienes ahora
  const { ready, isAuth, isLoginRoute } = useAuthClient();

  // si es /login (con basePath) → sin chrome
  const hideChrome = isLoginRoute;

  useEffect(() => {
    console.log("[ClientShell] isLoginRoute:", isLoginRoute);
    console.log("[ClientShell] isAuth:", isAuth);
    console.log("[ClientShell] ready:", ready);
  }, [isLoginRoute, isAuth, ready]);

  if (hideChrome) {
    // login: pantalla completa sin header, pero con footer abajo
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 w-full">{children}</div>
        <AppFooter />
        <ToastContainer />
      </div>
    );
  }

  // resto de rutas
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-6 py-6 flex-1 w-full">
        {ready ? children : <p className="text-sm text-slate-400">Cargando…</p>}
      </main>

      <AppFooter />
      {isAuth && <FabRadialNav />}

      <ToastContainer />
    </div>
  );
}
