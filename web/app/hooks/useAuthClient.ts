"use client";

import { useEffect, useState } from "react";

// si cambias el basePath en next.config, cambia esto también
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/board";

export function useAuthClient() {
  const [ready, setReady] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [isLoginRoute, setIsLoginRoute] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = window.localStorage.getItem("kc_token") || getCookie("auth");
    const path = window.location.pathname;

    // normalizar: /board/login → login
    const loginUrl = `${BASE_PATH}/login`;
    const isLogin = path === loginUrl;

    setIsLoginRoute(isLogin);
    setIsAuth(!!token);
    setReady(true);
  }, []);

  return { ready, isAuth, isLoginRoute };
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : null;
}
