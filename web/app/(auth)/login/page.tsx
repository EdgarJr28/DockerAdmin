"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Auth } from "@/app/libs/api";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Server,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@ludycom.com");
  const [password, setPassword] = useState("Admin2026");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const r = useRouter();

  // detectar tema actual
  useEffect(() => {
    if (typeof window === "undefined") return;
    const html = document.documentElement;
    const dark = html.classList.contains("dark");
    setIsDark(dark);

    const handler = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    window.addEventListener("theme:changed", handler);
    return () => window.removeEventListener("theme:changed", handler);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await Auth.login(email, password);
      r.replace("/dashboard");
    } catch (err: any) {
      setError(err?.message || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  // fondo base
  const baseBg = isDark ? "bg-slate-950" : "bg-[#b4b8bf]";

  return (
    <div
      className={`min-h-screen flex items-center justify-center relative overflow-hidden ${baseBg} px-4`}
    >
      {/* capa de degradé según tema */}
      {isDark ? (
        <div
          className="
            pointer-events-none
            absolute inset-0
            bg-[radial-gradient(circle_at_top,_rgba(34,197,235,0.18),_transparent_55%)]
          "
        />
      ) : (
        <div
          className="
            pointer-events-none
            absolute inset-0
            bg-gradient-to-br from-[#c3c7ce] via-[#d7dbe1] to-[#eef1f5]
          "
        />
      )}

      {/* ───── “mozaico” de piezas de vidrio (sin panal) ───── */}

      {/* pieza 1 grande arriba izquierda */}
      <div
        className={`
          pointer-events-none
          absolute -top-20 -left-6 h-56 w-56
          rounded-[28%_72%_65%_35%]
          ${isDark
            ? "bg-slate-900/20 border border-cyan-200/5"
            : "bg-white/25 border border-white/35"}
          backdrop-blur-md
          shadow-[0_18px_50px_rgba(15,23,42,0.20)]
        `}
      />

      {/* pieza 2 oval más abajo */}
      <div
        className={`
          pointer-events-none
          absolute bottom-[-70px] left-[20%] h-64 w-80
          rounded-[999px]
          ${isDark
            ? "bg-[radial-gradient(circle_at_30%_30%,rgba(15,118,110,0.35),rgba(15,23,42,0))]"
            : "bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.35),rgba(180,184,191,0))]"}
          backdrop-blur-sm
          opacity-70
        `}
      />

      {/* pieza 3 cuadrada derecha */}
      <div
        className={`
          pointer-events-none
          absolute right-12 top-10 h-40 w-40
          rounded-3xl
          ${isDark
            ? "bg-slate-900/35 border border-cyan-200/10"
            : "bg-white/35 border border-white/45"}
          backdrop-blur-lg
          rotate-6
        `}
      />

      {/* pieza 4 más pequeña, para rellenar */}
      <div
        className={`
          pointer-events-none
          absolute right-[32%] top-[62%] h-28 w-28
          rounded-2xl
          ${isDark
            ? "bg-slate-900/25 border border-slate-700/30"
            : "bg-white/30 border border-white/40"}
          backdrop-blur
          rotate-[-8deg]
        `}
      />

      {/* pieza 5 atrás del form para sensación de capa */}
      <div
        className={`
          pointer-events-none
          absolute md:right-[9%] md:top-[23%] top-[10%] right-2
          h-72 w-72
          rounded-[38%_62%_70%_30%]
          ${isDark
            ? "bg-cyan-500/5"
            : "bg-white/14"}
          blur-[2px]
        `}
      />

      {/* contenido */}
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-6 items-center relative z-10">
        {/* Lado izquierdo */}
        <div
          className={`hidden md:flex flex-col gap-4 ${
            isDark ? "text-slate-100" : "text-slate-900"
          }`}
        >
          <div
            className={
              isDark
                ? "inline-flex items-center gap-2 rounded-full bg-slate-900/30 border border-cyan-400/40 px-3 py-1 w-max"
                : "inline-flex items-center gap-2 rounded-full bg-white/55 border border-slate-100 px-3 py-1 w-max backdrop-blur"
            }
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
            Docker Remote Orchestrator
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Docker Board
          </h1>
          <p
            className={
              isDark
                ? "text-sm text-slate-300/80 leading-relaxed"
                : "text-sm text-slate-700 leading-relaxed"
            }
          >
            Consola administrativa para gestionar hosts Docker remotos, tareas de
            scheduler y métricas. Accede con tus credenciales centralizadas.
          </p>

          {/* CUADROS en ambos temas */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div
              className={
                isDark
                  ? "rounded-xl border border-slate-800/80 bg-slate-900/40 px-4 py-3 shadow-[0_12px_45px_rgba(15,23,42,0.25)]"
                  : "rounded-xl border border-white/70 bg-white/70 backdrop-blur-md shadow-[0_10px_36px_rgba(124,134,151,0.32)] px-4 py-3"
              }
            >
              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                API Status
              </p>
              <p
                className={`text-sm flex items-center gap-1 font-medium ${
                  isDark ? "text-emerald-400" : "text-emerald-500"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                Online
              </p>
            </div>
            <div
              className={
                isDark
                  ? "rounded-xl border border-slate-800/80 bg-slate-900/40 px-4 py-3 shadow-[0_12px_45px_rgba(15,23,42,0.25)]"
                  : "rounded-xl border border-white/70 bg-white/70 backdrop-blur-md shadow-[0_10px_36px_rgba(124,134,151,0.32)] px-4 py-3"
              }
            >
              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                Auth Provider
              </p>
              <p
                className={
                  isDark
                    ? "text-sm flex items-center gap-1 text-cyan-400 font-medium"
                    : "text-sm flex items-center gap-1 text-cyan-600 font-medium"
                }
              >
                <ShieldCheck className="h-4 w-4" /> Keycloak
              </p>
              <p
                className={`text-[11px] mt-1 ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                realm: docker-admin
              </p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div
          className={
            isDark
              ? "bg-slate-950/70 border border-slate-800/80 rounded-2xl p-6 md:p-7 backdrop-blur shadow-[0_16px_58px_rgba(0,0,0,0.45)]"
              : "bg-white/70 border border-white/75 backdrop-blur-xl rounded-2xl p-6 md:p-7 shadow-[0_16px_65px_rgba(15,23,42,0.16)]"
          }
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <p
                className={
                  isDark
                    ? "text-xs text-slate-400 mb-1"
                    : "text-xs text-slate-500 mb-1"
                }
              >
                Panel de acceso
              </p>
              <h2
                className={
                  isDark
                    ? "text-xl font-semibold text-slate-100"
                    : "text-xl font-semibold text-slate-900"
                }
              >
                Inicia sesión
              </h2>
            </div>
            <span
              className={
                isDark
                  ? "text-[10px] uppercase px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-400/30"
                  : "text-[10px] uppercase px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200"
              }
            >
              admin only
            </span>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <label
                className={
                  isDark ? "text-xs text-slate-200" : "text-xs text-slate-700"
                }
              >
                Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  className={`w-full rounded-lg py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/70 focus:border-cyan-500/70 ${
                    isDark
                      ? "bg-slate-900/40 border border-slate-700/70 text-slate-100 placeholder:text-slate-500"
                      : "bg-white/60 border border-slate-200/90 text-slate-900 placeholder:text-slate-400 backdrop-blur"
                  }`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  type="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label
                className={
                  isDark ? "text-xs text-slate-200" : "text-xs text-slate-700"
                }
              >
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  className={`w-full rounded-lg py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/70 focus:border-cyan-500/70 ${
                    isDark
                      ? "bg-slate-900/40 border border-slate-700/70 text-slate-100 placeholder:text-slate-500"
                      : "bg-white/60 border border-slate-200/90 text-slate-900 placeholder:text-slate-400 backdrop-blur"
                  }`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  type={showPass ? "text" : "password"}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-300"
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error ? (
              <div
                className={
                  isDark
                    ? "rounded-md bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-200"
                    : "rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700"
                }
              >
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-medium rounded-lg py-2.5 text-sm transition-colors"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  Autenticando...
                </>
              ) : (
                "Ingresar"
              )}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-[11px] text-slate-500">
            <p>Versión UI: 0.1.0</p>
            <p className="inline-flex items-center gap-1">
              <Server className="h-3 w-3" /> localhost:8080
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
