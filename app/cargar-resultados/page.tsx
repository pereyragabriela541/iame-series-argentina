"use client";

import { createClient } from "@supabase/supabase-js";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";

import PageHeader from "@/components/PageHeader";
import {
  RESULT_SESSION_LABELS,
  groupRoundResultsByCategory,
} from "@/lib/round-results-order";

interface RoundOption {
  id: string;
  round_number: number;
  name: string;
  status: "upcoming" | "live" | "finished";
}

interface CategoryOption {
  id: string;
  name: string;
  sort_order: number;
}

interface ResultItem {
  id: string;
  round_id: string;
  category_id: string;
  label: string;
  pdf_url: string;
  sort_order: number;
}

interface MetaResponse {
  rounds: RoundOption[];
  categories: CategoryOption[];
  results: ResultItem[];
}

const STORAGE_KEY = "iame-admin-resultados-token";

async function adminApi(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  authToken: string,
  body?: Record<string, unknown>,
) {
  const response = await fetch("/api/admin/resultados", {
    method,
    headers: {
      "x-admin-token": authToken,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(String(data.error ?? "Clave incorrecta o error del servidor"));
  }
  return data;
}

export default function CargarResultadosPage() {
  const [token, setToken] = useState("");
  const [savedToken, setSavedToken] = useState("");
  const [rounds, setRounds] = useState<RoundOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [roundId, setRoundId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [label, setLabel] = useState<string>(RESULT_SESSION_LABELS[0]);
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedRound = rounds.find((round) => round.id === roundId);
  const selectedResults = useMemo(
    () => results.filter((result) => result.round_id === roundId),
    [results, roundId],
  );
  const groupedResults = useMemo(
    () => groupRoundResultsByCategory(selectedResults, categories),
    [selectedResults, categories],
  );

  const loadMeta = useCallback(async (authToken: string) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const data = (await adminApi("GET", authToken)) as unknown as MetaResponse;
      setRounds(data.rounds);
      setCategories(data.categories);
      setResults(data.results);

      const fecha5 = data.rounds.find((round) => round.round_number === 5);
      setRoundId((current) => current || fecha5?.id || data.rounds[0]?.id || "");
      setCategoryId((current) => current || data.categories[0]?.id || "");
      sessionStorage.setItem(STORAGE_KEY, authToken);
      setSavedToken(authToken);
    } catch (caught) {
      setSavedToken("");
      setRounds([]);
      setError(caught instanceof Error ? caught.message : "No se pudo ingresar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      setToken(stored);
      void loadMeta(stored);
    }
  }, [loadMeta]);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    setError(null);
    setMessage(null);
    const nextFile = event.target.files?.[0] ?? null;
    if (nextFile && !nextFile.name.toLowerCase().endsWith(".pdf")) {
      setFile(null);
      setError("Elegí un archivo PDF");
      return;
    }
    if (nextFile && nextFile.size > 50 * 1024 * 1024) {
      setFile(null);
      setError("El PDF supera el máximo de 50 MB");
      return;
    }
    setFile(nextFile);
  }

  async function uploadResult() {
    if (!file || !roundId || !categoryId || !label.trim()) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const prepared = await adminApi("POST", savedToken, {
        action: "prepare",
        roundId,
        categoryId,
        fileSize: file.size,
      });
      const path = String(prepared.path);
      const uploadToken = String(prepared.token);
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Falta configurar Supabase en el sitio");
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      const { error: uploadError } = await supabase.storage
        .from("resultados")
        .uploadToSignedUrl(path, uploadToken, file, {
          contentType: "application/pdf",
        });
      if (uploadError) throw uploadError;

      const completed = await adminApi("POST", savedToken, {
        action: "complete",
        roundId,
        categoryId,
        label: label.trim(),
        path,
      });
      const result = completed.result as ResultItem;
      setResults((current) => [...current, result]);
      setFile(null);
      setFileInputKey((current) => current + 1);
      setMessage("PDF cargado correctamente. Podés cargar otra categoría.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo subir el PDF");
    } finally {
      setLoading(false);
    }
  }

  async function removeResult(result: ResultItem) {
    if (!window.confirm(`¿Eliminar “${result.label}”?`)) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await adminApi("DELETE", savedToken, { resultId: result.id });
      setResults((current) => current.filter((item) => item.id !== result.id));
      setMessage("Resultado eliminado.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo eliminar");
    } finally {
      setLoading(false);
    }
  }

  async function publishRound() {
    if (!selectedRound || selectedResults.length === 0) return;
    if (
      !window.confirm(
        `¿Publicar ${selectedRound.name}? Los PDFs aparecerán en la sección Resultados.`,
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await adminApi("PATCH", savedToken, { roundId });
      setRounds((current) =>
        current.map((round) =>
          round.id === roundId ? { ...round, status: "finished" } : round,
        ),
      );
      setMessage("Fecha publicada. Los resultados ya están visibles.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo publicar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-[70vh] max-w-lg px-5 py-10">
      <PageHeader
        kicker="Organización"
        title="Cargar resultados"
        subtitle="Subí los PDF de cada categoría directamente desde tu celular."
      />

      <div className="space-y-5 border border-neutral-800 bg-neutral-900/50 p-5">
        {!savedToken ? (
          <>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Clave de acceso
              </span>
              <input
                type="password"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                className="mt-2 w-full border border-neutral-700 bg-neutral-950 px-3 py-3 text-white"
                placeholder="Clave administrativa"
                autoComplete="current-password"
              />
            </label>
            <button
              type="button"
              onClick={() => void loadMeta(token.trim())}
              disabled={!token.trim() || loading}
              className="w-full bg-iame-red px-4 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50"
            >
              {loading ? "Ingresando…" : "Entrar"}
            </button>
          </>
        ) : (
          <>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Fecha
              </span>
              <select
                value={roundId}
                onChange={(event) => setRoundId(event.target.value)}
                className="mt-2 w-full border border-neutral-700 bg-neutral-950 px-3 py-3 text-white"
              >
                {rounds.map((round) => (
                  <option key={round.id} value={round.id}>
                    Fecha {round.round_number} — {round.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Categoría
              </span>
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="mt-2 w-full border border-neutral-700 bg-neutral-950 px-3 py-3 text-white"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Sesión
              </span>
              <select
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                className="mt-2 w-full border border-neutral-700 bg-neutral-950 px-3 py-3 text-white"
              >
                {RESULT_SESSION_LABELS.map((session) => (
                  <option key={session} value={session}>
                    {session}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Archivo PDF
              </span>
              <input
                key={fileInputKey}
                type="file"
                accept="application/pdf,.pdf"
                onChange={chooseFile}
                className="mt-2 block w-full text-sm text-neutral-300 file:mr-3 file:border-0 file:bg-iame-navy file:px-4 file:py-3 file:text-xs file:font-bold file:uppercase file:text-white"
              />
            </label>

            <button
              type="button"
              onClick={() => void uploadResult()}
              disabled={!file || !categoryId || !label.trim() || loading}
              className="w-full bg-iame-red px-4 py-4 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50"
            >
              {loading ? "Subiendo…" : "Subir PDF"}
            </button>

            <section className="space-y-3 border-t border-neutral-800 pt-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                PDF cargados ({selectedResults.length})
              </h2>
              {selectedResults.length ? (
                <div className="space-y-4">
                  {groupedResults.map(({ category, results: categoryResults }) => (
                    <div key={category.id} className="space-y-2">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-white">
                        {category.name}
                      </h3>
                      {categoryResults.map((result) => (
                        <div
                          key={result.id}
                          className="flex items-center justify-between gap-3 border border-neutral-800 bg-neutral-950 p-3"
                        >
                          <a
                            href={result.pdf_url}
                            target="_blank"
                            rel="noreferrer"
                            className="min-w-0 truncate text-sm text-white underline"
                          >
                            {result.label}
                          </a>
                          <button
                            type="button"
                            onClick={() => void removeResult(result)}
                            disabled={loading}
                            className="shrink-0 px-2 py-2 text-[10px] font-bold uppercase text-iame-red"
                          >
                            Eliminar
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500">
                  Todavía no cargaste archivos para esta fecha.
                </p>
              )}
            </section>

            <button
              type="button"
              onClick={() => void publishRound()}
              disabled={
                selectedResults.length === 0 ||
                loading ||
                selectedRound?.status === "finished"
              }
              className="w-full border border-white px-4 py-4 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-40"
            >
              {selectedRound?.status === "finished"
                ? "Fecha publicada"
                : "Publicar fecha"}
            </button>

            <p className="text-xs leading-relaxed text-neutral-500">
              Primero cargá todos los PDF. Cuando termines, tocá “Publicar fecha”
              para que aparezcan en Resultados.
            </p>
          </>
        )}

        {error ? <p className="text-sm text-iame-red">{error}</p> : null}
        {message ? <p className="text-sm text-green-400">{message}</p> : null}
      </div>
    </main>
  );
}
