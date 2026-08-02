"use client";

import { useEffect, useState } from "react";

export const APP_LOGIN_DEEP_LINK = "iame-series://login";

interface ReturnToAppLinkProps {
  label?: string;
  className?: string;
  /** Intenta volver a la app automáticamente al montar (p. ej. tras guardar contraseña). */
  autoOpen?: boolean;
  /**
   * Si true, prioriza el deep link (útil cuando el usuario viene de Safari/Mail).
   * Si false, solo indica cerrar con Listo/Done (navegador in-app de la app).
   */
  preferDeepLink?: boolean;
}

/**
 * Vuelve a la app.
 * - Desde Safari/Mail el deep link suele funcionar.
 * - Desde el navegador in-app de iOS (SFSafariViewController) el scheme
 *   iame-series:// está bloqueado: la única salida es Listo/Done.
 */
export default function ReturnToAppLink({
  label = "Abrir la app",
  className = "inline-block bg-iame-red px-6 py-3 text-xs font-bold uppercase tracking-widest text-white no-underline hover:bg-iame-red/90",
  autoOpen = false,
  preferDeepLink = true,
}: ReturnToAppLinkProps) {
  const [tried, setTried] = useState(false);

  function openApp() {
    setTried(true);
    try {
      window.location.assign(APP_LOGIN_DEEP_LINK);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!autoOpen || !preferDeepLink) return;
    const t = window.setTimeout(openApp, 400);
    return () => window.clearTimeout(t);
  }, [autoOpen, preferDeepLink]);

  if (!preferDeepLink) {
    return (
      <div className="mt-8 rounded border border-neutral-700 bg-neutral-900 px-4 py-4 text-center">
        <p className="text-sm font-semibold text-white">Para volver a la app</p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-400">
          Tocá <span className="font-bold text-iame-sky">Listo</span> o{" "}
          <span className="font-bold text-iame-sky">Done</span> arriba a la
          izquierda de esta ventana.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 text-center">
      <button type="button" onClick={openApp} className={className}>
        {label}
      </button>
      <p className="mt-4 text-xs leading-relaxed text-neutral-500">
        {tried
          ? "Si no abrió la app, tocá Listo / Done arriba a la izquierda."
          : "Si el botón no responde, tocá Listo / Done arriba a la izquierda."}
      </p>
    </div>
  );
}
