"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient, type EmailOtpType } from "@supabase/supabase-js";

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

function NuevaContrasenaForm() {
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setSessionError(true);
      return;
    }

    let cancelled = false;

    async function establishSession() {
      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (code) {
        const { error: err } = await supabase!.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (err) {
          setSessionError(true);
          return;
        }
        setReady(true);
        return;
      }

      if (tokenHash && type) {
        const { error: err } = await supabase!.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as EmailOtpType,
        });
        if (cancelled) return;
        if (err) {
          setSessionError(true);
          return;
        }
        setReady(true);
        return;
      }

      const hash = typeof window !== "undefined" ? window.location.hash : "";
      if (hash.length > 1) {
        const params = new URLSearchParams(hash.slice(1));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          const { error: err } = await supabase!.auth.setSession({
            access_token,
            refresh_token,
          });
          if (cancelled) return;
          if (err) {
            setSessionError(true);
            return;
          }
          window.history.replaceState(null, "", window.location.pathname);
          setReady(true);
          return;
        }
      }

      const { data } = await supabase!.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        setReady(true);
        return;
      }
      setSessionError(true);
    }

    void establishSession();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("No se pudo conectar con el servicio de cuentas.");
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }

    await supabase.auth.signOut();
    setDone(true);
  }

  if (sessionError) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-6 py-16 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-iame-sky">
          {BRAND.name}
        </p>
        <h1 className="mt-4 text-2xl font-bold uppercase text-white">
          Link inválido o vencido
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-neutral-400">
          Pedí un nuevo link desde la app (¿Olvidaste la contraseña?) e intentá
          de nuevo.
        </p>
        <a
          href="/auth/recuperar"
          className="mt-8 inline-block bg-iame-red px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-iame-red/90"
        >
          Pedir nuevo link
        </a>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-6 py-16 text-center">
        <p className="text-sm text-neutral-400">Validando link…</p>
      </main>
    );
  }

  if (done) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-6 py-16 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-iame-sky">
          {BRAND.name}
        </p>
        <h1 className="mt-4 text-2xl font-bold uppercase text-white">
          Contraseña actualizada
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-neutral-400">
          Ya podés iniciar sesión en la app con tu email y la nueva contraseña.
        </p>
        <ReturnToAppLink
          label="Abrir la app"
          autoOpen
          className="inline-block bg-iame-red px-6 py-3 text-xs font-bold uppercase tracking-widest text-white no-underline hover:bg-iame-red/90"
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-6 py-16">
      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-iame-sky">
        {BRAND.name}
      </p>
      <h1 className="mt-4 text-center text-2xl font-bold uppercase text-white">
        Nueva contraseña
      </h1>
      <p className="mt-3 text-center text-sm text-neutral-400">
        Elegí una contraseña nueva para tu cuenta.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
          Contraseña nueva
          <div className="relative mt-2">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-neutral-700 bg-neutral-900 px-4 py-3 pr-12 text-base text-white outline-none focus:border-iame-sky"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-wide text-neutral-400"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? "Ocultar" : "Ver"}
            </button>
          </div>
        </label>

        <label className="block text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
          Confirmar contraseña
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-2 w-full border border-neutral-700 bg-neutral-900 px-4 py-3 text-base text-white outline-none focus:border-iame-sky"
          />
        </label>

        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-iame-red px-6 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50"
        >
          {loading ? "Guardando…" : "Guardar contraseña"}
        </button>
      </form>
    </main>
  );
}

export default function NuevaContrasenaPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-6 py-16 text-center">
          <p className="text-sm text-neutral-400">Cargando…</p>
        </main>
      }
    >
      <NuevaContrasenaForm />
    </Suspense>
  );
}
