// proxy.ts
import { NextRequest, NextResponse } from "next/server";

// IMPORTANT: matcher estático (Next lo exige)
export const config = {
  // aplicamos a todo menos assets y _next
  matcher: ["/((?!_next|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico|css|js|map)).*)"],
};

export async function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // 1) basePath real que Next ya resolvió
  const base = url.basePath || ""; // si tienes basePath: '/board', aquí viene '/board'

  // rutas que vamos a usar siempre “con base”
  const loginPath = `${base}/login`;
  const dashboardPath = `${base}/dashboard`;

  // 2) si la ruta no empieza por el base, la dejamos pasar
  if (!pathname.startsWith(base)) {
    return NextResponse.next();
  }

  // 3) leer token
  const token = req.cookies.get("auth")?.value ?? null;

  // 4) normalizar para saber “qué ruta es” sin el base
  //    ej: /board/login  -> /login
  //        /board        -> /
  const pathWithoutBase = pathname.slice(base.length) || "/";

  const isLogin = pathWithoutBase === "/login";
  const isRootOfBoard = pathWithoutBase === "/" || pathWithoutBase === "";

  // ---------- SIN TOKEN ----------
  if (!token) {
    // si estoy en /board → mándame a /board/login
    if (isRootOfBoard) {
      const to = url.clone();
      to.pathname = loginPath;
      to.searchParams.set("from", base || "/");
      return NextResponse.redirect(to);
    }

    // si estoy en cualquier otra cosa de /board menos /board/login → login
    if (!isLogin) {
      const to = url.clone();
      to.pathname = loginPath;
      // preservar a dónde quería ir
      to.searchParams.set("from", pathname + (url.search || ""));
      return NextResponse.redirect(to);
    }

    // si ya estoy en /board/login sin token → deja pasar
    return NextResponse.next();
  }

  // ---------- CON TOKEN ----------
  // si ya tengo token y estoy en /board/login → mándame al dashboard
  if (isLogin) {
    const to = url.clone();
    to.pathname = dashboardPath;
    return NextResponse.redirect(to);
  }

  // si tengo token y estoy en /board → mándame al dashboard
  if (isRootOfBoard) {
    const to = url.clone();
    to.pathname = dashboardPath;
    return NextResponse.redirect(to);
  }

  // todo lo demás, pasa
  return NextResponse.next();
}
