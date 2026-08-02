"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

import { APP_LOGIN_DEEP_LINK } from "@/components/ReturnToAppLink";
import { BRAND } from "@/lib/branding";
import { SITE_URL } from "@/lib/site";

function getBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("No se pudo conectar con el servicio de cuentas.");
      setLoading(false);
      return;
    }

    const normalized = email.trim().toLowerCase().replace(/\s+/g, "");
    const { error: err } = await supabase.auth.resetPasswordForEmail(normalized, {
      redirectTo: `${SITE_URL.replace(/\/$/, "")}/auth/nueva-contrasena`,
    });

    setLoading(false);
    if (err) {
      const lower = err.message.toLowerCase();
      if (lower.includes("security purposes") || lower.includes("only request")) {
        setError("Esperá unos segundos y volvé a pedir el link.");
      } else {
        setError(err.message);
      }
      return;
    }
    setSent(true);
  }

  function handleClose() {
    try {
      window.location.assign(APP_LOGIN_DEEP_LINK);
    } catch {
      // ignore
    }
    // Fallback si el deep link no cierra el navegador in-app
    window.setTimeout(() => {
      try {
        window.close();
      } catch {
        // ignore
      }
    }, 300);
  }

  if (sent) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-6 py-16 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-iame-sky">
          {BRAND.name}
        </p>
        <h1 className="mt-4 text-2xl font-bold uppercase text-white">
          Revisá tu email
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-neutral-300">
          Recibirás un link para restablecer la contraseña. Revisá también
          spam o correo no deseado.
        </p>
        <button
          type="button"
          onClick={handleClose}
          className="mt-8 w-full bg-iame-red px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-iame-red/90"
        >
          Cerrar
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-6 py-16">
      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-iame-sky">
        {BRAND.name}
      </p>
      <h1 className="mt-4 text-center text-2xl font-bold uppercase text-white">
        Recuperar contraseña
      </h1>
      <p className="mt-3 text-center text-sm text-neutral-400">
        Ingresá el email de tu cuenta y te mandamos un link para crear una
        contraseña nueva.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full border border-neutral-700 bg-neutral-900 px-4 py-3 text-base text-white outline-none focus:border-iame-sky"
          />
        </label>

        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-iame-red px-6 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50"
        >
          {loading ? "Enviando…" : "Enviar link"}
        </button>
      </form>
    </main>
  );
}
