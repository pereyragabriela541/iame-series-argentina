"use client";

import { useCallback, useEffect, useState } from "react";

import PageHeader from "@/components/PageHeader";

interface RoundOption {
  key: string;
  label: string;
}

const STORAGE_KEY = "iame-export-token";

export default function ExportarPage() {
  const [token, setToken] = useState("");
  const [savedToken, setSavedToken] = useState("");
  const [roundKey, setRoundKey] = useState("");
  const [rounds, setRounds] = useState<RoundOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      setToken(stored);
      setSavedToken(stored);
    }
  }, []);

  const loadRounds = useCallback(async (authToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/export/meta?token=${encodeURIComponent(authToken)}`,
      );
      if (!res.ok) throw new Error("Clave incorrecta o sin permiso");
      const data = (await res.json()) as { rounds: RoundOption[] };
      setRounds(data.rounds ?? []);
      if (data.rounds?.length && !roundKey) {
        setRoundKey(data.rounds[0].key);
      }
      sessionStorage.setItem(STORAGE_KEY, authToken);
      setSavedToken(authToken);
    } catch (e) {
      setRounds([]);
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [roundKey]);

  useEffect(() => {
    if (savedToken) void loadRounds(savedToken);
  }, [savedToken, loadRounds]);

  function downloadUrl(type: "inscriptos" | "turnos") {
    const params = new URLSearchParams({
      token: savedToken,
      round_key: roundKey,
    });
    return `/api/admin/export/${type}?${params}`;
  }

  return (
    <main className="mx-auto min-h-[70vh] max-w-lg px-5 py-10">
      <PageHeader
        kicker="Organización"
        title="Exportar listas"
        subtitle="Descargá inscriptos y turnos en CSV desde el celular."
      />

      <div className="space-y-4 border border-neutral-800 bg-neutral-900/50 p-5">
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Clave de acceso
          </span>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="mt-2 w-full border border-neutral-700 bg-neutral-950 px-3 py-3 text-white"
            placeholder="La que configuraste en Vercel"
            autoComplete="current-password"
          />
        </label>

        <button
          type="button"
          onClick={() => void loadRounds(token.trim())}
          disabled={!token.trim() || loading}
          className="w-full bg-iame-red px-4 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50"
        >
          {loading ? "Cargando…" : "Entrar"}
        </button>

        {error ? <p className="text-sm text-iame-red">{error}</p> : null}

        {savedToken && rounds.length > 0 ? (
          <>
            <label className="block pt-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Fecha
              </span>
              <select
                value={roundKey}
                onChange={(e) => setRoundKey(e.target.value)}
                className="mt-2 w-full border border-neutral-700 bg-neutral-950 px-3 py-3 text-white"
              >
                {rounds.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 pt-2">
              <a
                href={downloadUrl("inscriptos")}
                className="block bg-iame-navy px-4 py-4 text-center text-xs font-bold uppercase tracking-widest text-white"
              >
                Descargar inscriptos (.csv)
              </a>
              <a
                href={downloadUrl("turnos")}
                className="block border border-iame-navy px-4 py-4 text-center text-xs font-bold uppercase tracking-widest text-white"
              >
                Descargar turnos (.csv)
              </a>
            </div>

            <p className="text-xs leading-relaxed text-neutral-500">
              Los archivos CSV se abren en Excel, Numbers o Google Sheets. En
              iPhone podés compartirlos desde Safari después de descargar.
            </p>
          </>
        ) : null}

        {savedToken && !loading && rounds.length === 0 && !error ? (
          <p className="text-sm text-neutral-400">
            No hay fechas con inscriptos o turnos todavía.
          </p>
        ) : null}
      </div>
    </main>
  );
}
