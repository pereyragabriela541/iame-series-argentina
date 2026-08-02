"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Si el mail de recovery redirige al Site URL, a /auth/confirmado u otra ruta
 * con tokens en # o ?code=&type=recovery, reenviamos a nueva contraseña.
 */
export default function AuthRecoveryRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Evitar loop en la pantalla destino / pedido de link.
    if (
      pathname?.startsWith("/auth/nueva-contrasena") ||
      pathname?.startsWith("/auth/recuperar")
    ) {
      return;
    }

    const hash = window.location.hash;
    if (hash.length > 1) {
      const params = new URLSearchParams(hash.slice(1));
      if (params.get("type") === "recovery" && params.get("access_token")) {
        window.location.replace(`/auth/nueva-contrasena${hash}`);
        return;
      }
    }

    const search = new URLSearchParams(window.location.search);
    const code = search.get("code");
    const tokenHash = search.get("token_hash");
    const type = search.get("type");
    const next = search.get("next");
    if (type === "recovery" || next === "recovery") {
      const q = new URLSearchParams();
      if (code) q.set("code", code);
      if (tokenHash) q.set("token_hash", tokenHash);
      if (type) q.set("type", type);
      const qs = q.toString();
      router.replace(`/auth/nueva-contrasena${qs ? `?${qs}` : ""}`);
    }
  }, [pathname, router]);

  return null;
}
