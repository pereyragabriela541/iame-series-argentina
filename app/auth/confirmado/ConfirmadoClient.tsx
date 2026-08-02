"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

import { BRAND } from "@/lib/branding";
import ReturnToAppLink from "@/components/ReturnToAppLink";

function getBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function recoveryHash(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (hash.length < 2) return null;
  const params = new URLSearchParams(hash.slice(1));
  if (params.get("type") === "recovery" && params.get("access_token")) {
    return hash.startsWith("#") ? hash : `#${hash}`;
  }
  return null;
}

function goToNuevaContrasena(query?: URLSearchParams, hash?: string) {
  const q = query?.toString();
  const dest = `/auth/nueva-contrasena${q ? `?${q}` : ""}${hash ?? ""}`;
  window.location.replace(dest);
}

export default function AuthConfirmadoClient() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"ok" | "error" | "pending">(() => {
    if (searchParams.get("error") === "1") return "error";
    // Código, tokens o recovery → hay que procesar (no mostrar "confirmado" aún).
    if (searchParams.get("pending") === "1") return "pending";
    if (searchParams.get("code")) return "pending";
    if (searchParams.get("type") === "recovery") return "pending";
    if (searchParams.get("token_hash")) return "pending";
    return "ok";
  });

  useEffect(() => {
    // Recovery puede llegar a esta URL (Site URL / redirect mal configurado).
    // Hay que reenviar ANTES de tratarlo como confirmación de email.
    const type = searchParams.get("type");
    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash");
    const next = searchParams.get("next");

    if (type === "recovery" || next === "recovery") {
      const q = new URLSearchParams();
      if (code) q.set("code", code);
      if (tokenHash) q.set("token_hash", tokenHash);
      if (type) q.set("type", type);
      goToNuevaContrasena(q);
      return;
    }

    const hashRecovery = recoveryHash();
    if (hashRecovery) {
      goToNuevaContrasena(undefined, hashRecovery);
      return;
    }

    if (status !== "pending") return;

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setStatus("error");
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        goToNuevaContrasena();
      }
    });

    if (code) {
      void supabase.auth.exchangeCodeForSession(code).then((result) => {
        if (result.error) {
          setStatus("error");
          return;
        }
        // PKCE: si el code-verifier de este navegador marcó recovery, redirigir.
        const redirectType = (
          result.data as { redirectType?: string | null } | null
        )?.redirectType;
        if (redirectType === "recovery") {
          goToNuevaContrasena();
          return;
        }
        setStatus("ok");
        window.history.replaceState(null, "", window.location.pathname);
      });
      return () => subscription.unsubscribe();
    }

    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (!hash || hash.length < 2) {
      setStatus("error");
      subscription.unsubscribe();
      return;
    }

    const params = new URLSearchParams(hash.slice(1));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (access_token && refresh_token) {
      void supabase.auth
        .setSession({ access_token, refresh_token })
        .then(({ error }) => {
          setStatus(error ? "error" : "ok");
          window.history.replaceState(null, "", window.location.pathname);
        });
      return () => subscription.unsubscribe();
    }

    setStatus("error");
    return () => subscription.unsubscribe();
  }, [status, searchParams]);

  const ok = status === "ok";
  const pending = status === "pending";

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-6 py-16 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-iame-sky">
        {BRAND.name}
      </p>
      <h1 className="mt-4 text-2xl font-bold uppercase text-white">
        {pending
          ? "Confirmando…"
          : ok
            ? "Email confirmado"
            : "No se pudo confirmar"}
      </h1>
      {!ok && !pending ? (
        <p className="mt-4 text-sm leading-relaxed text-neutral-400">
          El enlace puede haber vencido o no llegó completo. Volvé a la app,
          pedí un nuevo mail de confirmación o escribinos.
        </p>
      ) : null}
      {ok ? (
        <>
          <p className="mt-4 text-sm leading-relaxed text-neutral-400">
            Ya podés iniciar sesión en la app con tu email y contraseña.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-neutral-500">
            Si pediste restablecer la contraseña,{" "}
            <a
              href="/auth/nueva-contrasena"
              className="text-iame-sky underline hover:text-white"
            >
              elegí una contraseña nueva acá
            </a>
            .
          </p>
          <ReturnToAppLink
            label="Abrir la app"
            className="inline-block bg-iame-red px-6 py-3 text-xs font-bold uppercase tracking-widest text-white no-underline hover:bg-iame-red/90"
          />
        </>
      ) : null}
    </main>
  );
}
