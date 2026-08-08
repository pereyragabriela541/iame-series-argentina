"use client";

import { createClient } from "@supabase/supabase-js";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";

import PageHeader from "@/components/PageHeader";
import {
  RESULT_SESSION_LABELS,
  groupRoundResultsByCategory,
  type ResultSessionLabel,
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
  slug: string;
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
  sessionLabels?: string[];
}

type UploadMode = "single" | "bulk";

interface BulkRow {
  key: string;
  file: File;
  fileName: string;
  status: "ready" | "needs_review";
  categoryId: string | null;
  label: ResultSessionLabel | null;
  reason: string;
  source: string | null;
  duplicateResultId: string | null;
  replaceDuplicate: boolean;
  include: boolean;
}

interface BulkSummary {
  uploaded: number;
  skipped: number;
  replaced: number;
  errors: string[];
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

type IdentifyMatchRow = {
  fileName: string;
  status: "ready" | "needs_review";
  categoryId: string | null;
  label: ResultSessionLabel | null;
  reason: string;
  source: string | null;
  duplicateResultId: string | null;
};

/** Vercel limita el body ~4.5 MB; lotes pequeños evitan el corte. */
const IDENTIFY_BATCH_MAX_FILES = 4;
const IDENTIFY_BATCH_MAX_BYTES = 2.5 * 1024 * 1024;

function chunkFilesForIdentify(files: File[]): File[][] {
  const batches: File[][] = [];
  let current: File[] = [];
  let currentBytes = 0;

  for (const file of files) {
    const wouldExceedCount = current.length >= IDENTIFY_BATCH_MAX_FILES;
    const wouldExceedBytes =
      current.length > 0 && currentBytes + file.size > IDENTIFY_BATCH_MAX_BYTES;
    if (wouldExceedCount || wouldExceedBytes) {
      batches.push(current);
      current = [];
      currentBytes = 0;
    }
    current.push(file);
    currentBytes += file.size;
  }
  if (current.length) batches.push(current);
  return batches;
}

async function identifyBulkBatch(
  authToken: string,
  roundId: string,
  files: File[],
): Promise<IdentifyMatchRow[]> {
  const form = new FormData();
  form.set("roundId", roundId);
  for (const file of files) form.append("files", file);

  const response = await fetch("/api/admin/resultados", {
    method: "POST",
    headers: { "x-admin-token": authToken },
    body: form,
  });
  const raw = await response.text();
  let data: { error?: string; matches?: IdentifyMatchRow[] } = {};
  try {
    data = raw ? (JSON.parse(raw) as typeof data) : {};
  } catch {
    data = {};
  }
  if (!response.ok) {
    if (response.status === 413) {
      throw new Error(
        "Los archivos son demasiado pesados para analizar de una vez. Probá de a menos PDFs.",
      );
    }
    throw new Error(
      data.error ??
        `No se pudieron analizar los PDFs (HTTP ${response.status})`,
    );
  }
  return data.matches ?? [];
}

async function identifyBulk(
  authToken: string,
  roundId: string,
  files: File[],
  onProgress?: (done: number, total: number) => void,
) {
  const batches = chunkFilesForIdentify(files);
  const matches: IdentifyMatchRow[] = [];
  let done = 0;
  onProgress?.(0, files.length);

  for (const batch of batches) {
    const batchMatches = await identifyBulkBatch(authToken, roundId, batch);
    matches.push(...batchMatches);
    done += batch.length;
    onProgress?.(done, files.length);
  }

  return matches;
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
  const [mode, setMode] = useState<UploadMode>("bulk");
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [bulkFileKey, setBulkFileKey] = useState(0);
  const [bulkSummary, setBulkSummary] = useState<BulkSummary | null>(null);
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

  const categoryNameById = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const bulkReadyCount = bulkRows.filter(
    (row) => row.include && row.status === "ready" && row.categoryId && row.label,
  ).length;
  const bulkReviewCount = bulkRows.filter((row) => row.status === "needs_review").length;
  const bulkDuplicateCount = bulkRows.filter((row) => row.duplicateResultId).length;

  const loadMeta = useCallback(async (authToken: string) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const data = (await adminApi("GET", authToken)) as unknown as MetaResponse;
      setRounds(data.rounds);
      setCategories(data.categories);
      setResults(data.results);

      const fecha6 = data.rounds.find((round) => round.round_number === 6);
      setRoundId((current) => current || fecha6?.id || data.rounds[0]?.id || "");
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

  async function uploadOne(
    authToken: string,
    params: {
      roundId: string;
      categoryId: string;
      label: string;
      file: File;
      replaceResultId?: string | null;
    },
  ): Promise<ResultItem> {
    const prepared = await adminApi("POST", authToken, {
      action: "prepare",
      roundId: params.roundId,
      categoryId: params.categoryId,
      fileSize: params.file.size,
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
      .uploadToSignedUrl(path, uploadToken, params.file, {
        contentType: "application/pdf",
      });
    if (uploadError) throw uploadError;

    const completed = await adminApi("POST", authToken, {
      action: "complete",
      roundId: params.roundId,
      categoryId: params.categoryId,
      label: params.label.trim(),
      path,
      ...(params.replaceResultId
        ? { replaceResultId: params.replaceResultId }
        : {}),
    });
    return completed.result as ResultItem;
  }

  async function uploadResult() {
    if (!file || !roundId || !categoryId || !label.trim()) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await uploadOne(savedToken, {
        roundId,
        categoryId,
        label: label.trim(),
        file,
      });
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

  async function analyzeBulk(files: File[]) {
    if (!roundId || !files.length) return;
    setLoading(true);
    setError(null);
    setMessage(`Analizando 0/${files.length}…`);
    setBulkSummary(null);
    try {
      const matches = await identifyBulk(
        savedToken,
        roundId,
        files,
        (done, total) => setMessage(`Analizando ${done}/${total}…`),
      );
      const byName = new Map(files.map((file) => [file.name, file]));
      const seenKeys = new Map<string, string>();
      const rows: BulkRow[] = matches.map((match, index) => {
        const file =
          byName.get(match.fileName) ??
          files[index] ??
          files.find((item) => item.name === match.fileName);
        if (!file) {
          throw new Error(`No se encontró el archivo ${match.fileName}`);
        }

        let status = match.status;
        let reason = match.reason;
        let include = match.status === "ready" && !match.duplicateResultId;

        if (status === "ready" && match.categoryId && match.label) {
          const key = `${match.categoryId}::${match.label}`;
          const previous = seenKeys.get(key);
          if (previous) {
            status = "needs_review";
            reason = `Conflicto en el lote: mismo destino que “${previous}”`;
            include = false;
          } else {
            seenKeys.set(key, match.fileName);
          }
        }

        return {
          key: `${match.fileName}-${index}`,
          file,
          fileName: match.fileName,
          status,
          categoryId: match.categoryId,
          label: match.label,
          reason,
          source: match.source,
          duplicateResultId: match.duplicateResultId,
          replaceDuplicate: false,
          include,
        };
      });
      setBulkRows(rows);
      setMessage(
        `Analizados ${rows.length} archivos: ${rows.filter((row) => row.status === "ready").length} listos, ${rows.filter((row) => row.status === "needs_review").length} requieren revisión.`,
      );
    } catch (caught) {
      setBulkRows([]);
      setError(caught instanceof Error ? caught.message : "No se pudo analizar");
    } finally {
      setLoading(false);
    }
  }

  function onBulkFilesChosen(event: ChangeEvent<HTMLInputElement>) {
    const list = event.target.files ? Array.from(event.target.files) : [];
    const pdfs = list.filter((item) => item.name.toLowerCase().endsWith(".pdf"));
    if (!pdfs.length) {
      setError("Elegí uno o más archivos PDF");
      return;
    }
    void analyzeBulk(pdfs);
  }

  function updateBulkRow(key: string, patch: Partial<BulkRow>) {
    setBulkRows((current) =>
      current.map((row) => {
        if (row.key !== key) return row;
        const next = { ...row, ...patch };
        if (
          patch.categoryId !== undefined ||
          patch.label !== undefined
        ) {
          const hasCat = Boolean(next.categoryId);
          const hasLabel = Boolean(next.label);
          if (hasCat && hasLabel) {
            next.status = "ready";
            next.reason = next.duplicateResultId
              ? `Duplicado: ya existe “${next.label}”`
              : "Listo para cargar (revisión manual)";
            next.include =
              next.include || (!next.duplicateResultId && next.replaceDuplicate === false);
          }
        }
        return next;
      }),
    );
  }

  async function confirmBulkUpload() {
    const selected = bulkRows.filter(
      (row) =>
        row.include &&
        row.status === "ready" &&
        row.categoryId &&
        row.label &&
        (!row.duplicateResultId || row.replaceDuplicate),
    );
    if (!selected.length) {
      setError("No hay archivos listos para cargar. Revisá los pendientes o marcá reemplazos.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    const summary: BulkSummary = {
      uploaded: 0,
      skipped: bulkRows.length - selected.length,
      replaced: 0,
      errors: [],
    };
    const uploadedResults: ResultItem[] = [];

    for (const row of selected) {
      try {
        const result = await uploadOne(savedToken, {
          roundId,
          categoryId: row.categoryId!,
          label: row.label!,
          file: row.file,
          replaceResultId: row.replaceDuplicate ? row.duplicateResultId : null,
        });
        uploadedResults.push(result);
        summary.uploaded += 1;
        if (row.replaceDuplicate && row.duplicateResultId) summary.replaced += 1;
      } catch (caught) {
        summary.errors.push(
          `${row.fileName}: ${caught instanceof Error ? caught.message : "error"}`,
        );
      }
    }

    setResults((current) => {
      const withoutReplaced = current.filter(
        (item) =>
          !selected.some(
            (row) =>
              row.replaceDuplicate &&
              row.duplicateResultId &&
              row.duplicateResultId === item.id,
          ),
      );
      return [...withoutReplaced, ...uploadedResults];
    });
    setBulkSummary(summary);
    setBulkRows([]);
    setBulkFileKey((current) => current + 1);
    setMessage(
      `Carga finalizada: ${summary.uploaded} ok, ${summary.skipped} omitidos, ${summary.replaced} reemplazados, ${summary.errors.length} con error.`,
    );
    setLoading(false);
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
    <main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-10">
      <PageHeader
        kicker="Organización"
        title="Cargar resultados"
        subtitle="Carga individual o masiva de PDFs por fecha, con revisión antes de guardar."
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
                onChange={(event) => {
                  setRoundId(event.target.value);
                  setBulkRows([]);
                  setBulkSummary(null);
                }}
                className="mt-2 w-full border border-neutral-700 bg-neutral-950 px-3 py-3 text-white"
              >
                {rounds.map((round) => (
                  <option key={round.id} value={round.id}>
                    Fecha {round.round_number} — {round.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("bulk")}
                className={`flex-1 px-3 py-3 text-[10px] font-bold uppercase tracking-widest ${
                  mode === "bulk"
                    ? "bg-iame-red text-white"
                    : "border border-neutral-700 text-neutral-300"
                }`}
              >
                Carga masiva
              </button>
              <button
                type="button"
                onClick={() => setMode("single")}
                className={`flex-1 px-3 py-3 text-[10px] font-bold uppercase tracking-widest ${
                  mode === "single"
                    ? "bg-iame-red text-white"
                    : "border border-neutral-700 text-neutral-300"
                }`}
              >
                Carga individual
              </button>
            </div>

            {mode === "single" ? (
              <>
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
              </>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-neutral-400">
                  Seleccioná muchos PDFs. El sistema lee el texto y la metadata;
                  si el encabezado viene como imagen (MyLaps), usa el nombre del
                  archivo con las mismas reglas. Solo se cargan matches seguros.
                </p>

                <label className="block">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                    PDFs (múltiples)
                  </span>
                  <input
                    key={bulkFileKey}
                    type="file"
                    accept="application/pdf,.pdf"
                    multiple
                    onChange={onBulkFilesChosen}
                    className="mt-2 block w-full text-sm text-neutral-300 file:mr-3 file:border-0 file:bg-iame-navy file:px-4 file:py-3 file:text-xs file:font-bold file:uppercase file:text-white"
                  />
                </label>

                {bulkRows.length > 0 ? (
                  <section className="space-y-3">
                    <div className="flex flex-wrap gap-3 text-[11px] uppercase tracking-wider text-neutral-400">
                      <span>{bulkReadyCount} listos</span>
                      <span>{bulkReviewCount} revisión</span>
                      <span>{bulkDuplicateCount} duplicados</span>
                    </div>

                    <div className="max-h-[28rem] space-y-3 overflow-y-auto">
                      {bulkRows.map((row) => (
                        <div
                          key={row.key}
                          className="space-y-2 border border-neutral-800 bg-neutral-950 p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm text-white">{row.fileName}</p>
                              <p
                                className={`mt-1 text-xs ${
                                  row.status === "ready"
                                    ? "text-green-400"
                                    : "text-amber-400"
                                }`}
                              >
                                {row.status === "ready"
                                  ? `${categoryNameById[row.categoryId ?? ""] ?? "—"} → ${row.label ?? "—"} → ${
                                      row.duplicateResultId
                                        ? "duplicado"
                                        : "listo para cargar"
                                    }`
                                  : `requiere revisión — ${row.reason}`}
                              </p>
                              {row.source ? (
                                <p className="mt-1 text-[10px] uppercase tracking-wider text-neutral-500">
                                  Fuente: {row.source}
                                </p>
                              ) : null}
                            </div>
                            <label className="flex shrink-0 items-center gap-2 text-[10px] uppercase text-neutral-400">
                              <input
                                type="checkbox"
                                checked={row.include}
                                disabled={
                                  row.status !== "ready" ||
                                  !row.categoryId ||
                                  !row.label ||
                                  (Boolean(row.duplicateResultId) &&
                                    !row.replaceDuplicate)
                                }
                                onChange={(event) =>
                                  updateBulkRow(row.key, {
                                    include: event.target.checked,
                                  })
                                }
                              />
                              Incluir
                            </label>
                          </div>

                          {row.status === "needs_review" || row.duplicateResultId ? (
                            <div className="grid gap-2 sm:grid-cols-2">
                              <select
                                value={row.categoryId ?? ""}
                                onChange={(event) =>
                                  updateBulkRow(row.key, {
                                    categoryId: event.target.value || null,
                                    include: Boolean(event.target.value && row.label),
                                  })
                                }
                                className="border border-neutral-700 bg-neutral-900 px-2 py-2 text-sm text-white"
                              >
                                <option value="">Categoría…</option>
                                {categories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={row.label ?? ""}
                                onChange={(event) =>
                                  updateBulkRow(row.key, {
                                    label: (event.target.value ||
                                      null) as ResultSessionLabel | null,
                                    include: Boolean(
                                      row.categoryId && event.target.value,
                                    ),
                                  })
                                }
                                className="border border-neutral-700 bg-neutral-900 px-2 py-2 text-sm text-white"
                              >
                                <option value="">Sesión…</option>
                                {RESULT_SESSION_LABELS.map((session) => (
                                  <option key={session} value={session}>
                                    {session}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : null}

                          {row.duplicateResultId ? (
                            <label className="flex items-center gap-2 text-xs text-amber-300">
                              <input
                                type="checkbox"
                                checked={row.replaceDuplicate}
                                onChange={(event) =>
                                  updateBulkRow(row.key, {
                                    replaceDuplicate: event.target.checked,
                                    include: event.target.checked,
                                  })
                                }
                              />
                              Reemplazar el PDF existente
                            </label>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => void confirmBulkUpload()}
                      disabled={loading || bulkReadyCount === 0}
                      className="w-full bg-iame-red px-4 py-4 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50"
                    >
                      {loading
                        ? "Cargando…"
                        : `Confirmar carga (${bulkReadyCount})`}
                    </button>
                  </section>
                ) : null}

                {bulkSummary ? (
                  <div className="space-y-1 border border-neutral-800 bg-neutral-950 p-3 text-sm text-neutral-300">
                    <p>Cargados correctamente: {bulkSummary.uploaded}</p>
                    <p>Omitidos: {bulkSummary.skipped}</p>
                    <p>Reemplazados: {bulkSummary.replaced}</p>
                    <p>Con error: {bulkSummary.errors.length}</p>
                    {bulkSummary.errors.map((item) => (
                      <p key={item} className="text-iame-red">
                        {item}
                      </p>
                    ))}
                  </div>
                ) : null}
              </>
            )}

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
