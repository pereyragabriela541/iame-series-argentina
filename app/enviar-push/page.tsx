"use client";

import { useCallback, useEffect, useState } from "react";

import PageHeader from "@/components/PageHeader";

const STORAGE_KEY = "iame-export-token";

interface AdminNotification {
  id: string;
  title: string;
  body: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

function formatPushResult(push?: {
  sent?: number;
  tokens?: number;
  error?: string;
  skipped?: string;
}) {
  if (!push) return null;
  if (push.error || push.skipped) return push.error || push.skipped || null;
  const sent = push.sent ?? 0;
  return (
    `${sent} push${sent === 1 ? "" : "es"}` +
    (push.tokens != null
      ? ` · ${push.tokens} dispositivo${push.tokens === 1 ? "" : "s"}`
      : "")
  );
}

export default function EnviarPushPage() {
  const [token, setToken] = useState("");
  const [savedToken, setSavedToken] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [resendOnSave, setResendOnSave] = useState(true);
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const authHeaders = useCallback(
    () =>
      ({
        "Content-Type": "application/json",
        "x-admin-token": savedToken,
      }) as HeadersInit,
    [savedToken],
  );

  const loadList = useCallback(
    async (authToken: string) => {
      const res = await fetch(
        `/api/admin/push?token=${encodeURIComponent(authToken)}`,
      );
      if (!res.ok) throw new Error("Clave incorrecta o sin permiso");
      const data = (await res.json()) as { notifications?: AdminNotification[] };
      setItems(data.notifications ?? []);
    },
    [],
  );

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      setToken(stored);
      setSavedToken(stored);
    }
  }, []);

  useEffect(() => {
    if (!savedToken) return;
    setLoading(true);
    setError(null);
    void loadList(savedToken)
      .catch((e) => {
        setSavedToken("");
        setError(e instanceof Error ? e.message : "Error al cargar");
      })
      .finally(() => setLoading(false));
  }, [savedToken, loadList]);

  async function unlock() {
    const value = token.trim();
    if (!value) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await loadList(value);
      sessionStorage.setItem(STORAGE_KEY, value);
      setSavedToken(value);
    } catch (e) {
      setSavedToken("");
      setError(e instanceof Error ? e.message : "Error al validar");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(item: AdminNotification) {
    setEditingId(item.id);
    setTitle(item.title);
    setBody(item.body ?? "");
    setResendOnSave(false);
    setSuccess(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setTitle("");
    setBody("");
    setResendOnSave(true);
  }

  async function save() {
    if (!savedToken || !title.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/push", {
        method: editingId ? "PATCH" : "POST",
        headers: authHeaders(),
        body: JSON.stringify(
          editingId
            ? {
                id: editingId,
                title: title.trim(),
                body: body.trim(),
                resend: resendOnSave,
              }
            : { title: title.trim(), body: body.trim() },
        ),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        push?: {
          sent?: number;
          tokens?: number;
          error?: string;
          skipped?: string;
        };
      };
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");

      const pushMsg = formatPushResult(data.push);
      setSuccess(
        editingId
          ? `Alerta actualizada${pushMsg ? ` · ${pushMsg}` : ""}`
          : `Publicada${pushMsg ? ` · ${pushMsg}` : ""}`,
      );
      cancelEdit();
      await loadList(savedToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!savedToken) return;
    if (!confirm("¿Borrar esta alerta? No se puede deshacer.")) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/push?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "No se pudo borrar");
      if (editingId === id) cancelEdit();
      setSuccess("Alerta borrada");
      await loadList(savedToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al borrar");
    } finally {
      setLoading(false);
    }
  }

  async function resendOnly(item: AdminNotification) {
    if (!savedToken) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/push", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          id: item.id,
          title: item.title,
          body: item.body ?? "",
          resend: true,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        push?: {
          sent?: number;
          tokens?: number;
          error?: string;
          skipped?: string;
        };
      };
      if (!res.ok) throw new Error(data.error || "No se pudo reenviar");
      setSuccess(`Reenviado · ${formatPushResult(data.push) ?? "ok"}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al reenviar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-[70vh] max-w-lg px-5 py-10">
      <PageHeader
        kicker="Organización"
        title="Notificaciones push"
        subtitle="Creá, editá o borrá alertas y avisá a la app."
      />

      <div className="space-y-4 border border-neutral-800 bg-neutral-900/50 p-5">
        {!savedToken ? (
          <>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Clave de acceso
              </span>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="mt-2 w-full border border-neutral-700 bg-neutral-950 px-3 py-3 text-white"
                placeholder="La misma de Vercel (ADMIN_EXPORT_TOKEN)"
                autoComplete="current-password"
              />
            </label>
            <button
              type="button"
              onClick={() => void unlock()}
              disabled={!token.trim() || loading}
              className="w-full bg-iame-red px-4 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50"
            >
              {loading ? "Validando…" : "Entrar"}
            </button>
          </>
        ) : (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-iame-sky">
              {editingId ? "Editar alerta" : "Nueva alerta"}
            </p>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Título
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2 w-full border border-neutral-700 bg-neutral-950 px-3 py-3 text-white"
                placeholder="Ej: Cambio de horario Fecha 6"
                maxLength={120}
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Mensaje
              </span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="mt-2 min-h-28 w-full border border-neutral-700 bg-neutral-950 px-3 py-3 text-white"
                placeholder="Texto que ven en la notificación y en Alertas"
                maxLength={500}
              />
            </label>

            {editingId ? (
              <label className="flex items-center gap-2 text-sm text-neutral-300">
                <input
                  type="checkbox"
                  checked={resendOnSave}
                  onChange={(e) => setResendOnSave(e.target.checked)}
                />
                Reenviar push al guardar
              </label>
            ) : null}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void save()}
                disabled={!title.trim() || loading}
                className="flex-1 bg-iame-red px-4 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50"
              >
                {loading
                  ? "Guardando…"
                  : editingId
                    ? "Guardar cambios"
                    : "Publicar y enviar push"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={loading}
                  className="border border-neutral-700 px-4 py-3 text-xs font-bold uppercase tracking-widest text-neutral-300"
                >
                  Cancelar
                </button>
              ) : null}
            </div>
          </>
        )}

        {error ? <p className="text-sm text-iame-red">{error}</p> : null}
        {success ? <p className="text-sm text-iame-sky">{success}</p> : null}
      </div>

      {savedToken ? (
        <div className="mt-8 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Alertas publicadas
          </h2>
          {loading && items.length === 0 ? (
            <p className="text-sm text-neutral-500">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-neutral-500">Todavía no hay alertas.</p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="border border-neutral-800 bg-neutral-900/40 p-4"
              >
                <p className="text-sm font-bold uppercase text-white">
                  {item.title}
                </p>
                {item.body ? (
                  <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                    {item.body}
                  </p>
                ) : null}
                <p className="mt-2 font-mono text-[10px] text-neutral-600">
                  {item.published_at
                    ? new Date(item.published_at).toLocaleString("es-AR")
                    : item.created_at}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    disabled={loading}
                    className="border border-iame-navy px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => void resendOnly(item)}
                    disabled={loading}
                    className="border border-neutral-700 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-300"
                  >
                    Reenviar push
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(item.id)}
                    disabled={loading}
                    className="border border-iame-red/60 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-iame-red"
                  >
                    Borrar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </main>
  );
}
