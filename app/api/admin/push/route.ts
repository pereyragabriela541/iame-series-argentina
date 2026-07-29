import { NextResponse } from "next/server";

import {
  unauthorizedResponse,
  verifyAdminExportToken,
} from "@/lib/admin-export";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PushResult = {
  sent?: number;
  tokens?: number;
  skipped?: string;
  error?: string;
};

async function sendPush(payload: {
  notification_id: string;
  title: string;
  body: string;
}): Promise<PushResult> {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const secret =
    process.env.PUSH_WEBHOOK_SECRET?.trim() || "iame-push-2026-bsproyect";

  if (!base || !serviceKey) {
    return { skipped: "Faltan variables de Supabase para push" };
  }

  const url = `${base}/functions/v1/hyper-endpoint`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
        "x-push-secret": secret,
      },
      body: JSON.stringify(payload),
    });
    const json = (await res.json().catch(() => null)) as {
      sent?: number;
      tokens?: number;
      error?: string;
      message?: string;
    } | null;

    if (!res.ok) {
      return {
        error: json?.error || json?.message || `Push HTTP ${res.status}`,
      };
    }

    return { sent: json?.sent ?? 0, tokens: json?.tokens };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Error de red al enviar push",
    };
  }
}

function shouldSendViaApi() {
  return process.env.PUSH_VIA_API !== "0";
}

/** Lista alertas (admin). */
export async function GET(request: Request) {
  if (!verifyAdminExportToken(request)) return unauthorizedResponse();

  try {
    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("notifications")
      .select("id, title, body, is_published, published_at, created_at")
      .order("published_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notifications: data ?? [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al listar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Publica alerta + push. */
export async function POST(request: Request) {
  if (!verifyAdminExportToken(request)) return unauthorizedResponse();

  let title = "";
  let body = "";
  try {
    const json = (await request.json()) as { title?: string; body?: string };
    title = (json.title ?? "").trim();
    body = (json.body ?? "").trim();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!title) {
    return NextResponse.json(
      { error: "El título es obligatorio" },
      { status: 400 },
    );
  }

  try {
    const sb = createSupabaseAdmin();
    const { data: row, error } = await sb
      .from("notifications")
      .insert({
        title,
        body: body || null,
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .select("id, title, body")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const pushResult = shouldSendViaApi()
      ? await sendPush({
          notification_id: row.id,
          title: row.title,
          body: row.body ?? "",
        })
      : { skipped: "PUSH_VIA_API=0 (solo trigger DB)" };

    return NextResponse.json({
      ok: true,
      notification_id: row.id,
      push: pushResult,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al enviar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Edita alerta; opcionalmente reenvía push. */
export async function PATCH(request: Request) {
  if (!verifyAdminExportToken(request)) return unauthorizedResponse();

  let id = "";
  let title = "";
  let body = "";
  let resend = false;
  try {
    const json = (await request.json()) as {
      id?: string;
      title?: string;
      body?: string;
      resend?: boolean;
    };
    id = (json.id ?? "").trim();
    title = (json.title ?? "").trim();
    body = (json.body ?? "").trim();
    resend = Boolean(json.resend);
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!id || !title) {
    return NextResponse.json(
      { error: "id y título son obligatorios" },
      { status: 400 },
    );
  }

  try {
    const sb = createSupabaseAdmin();
    const { data: row, error } = await sb
      .from("notifications")
      .update({
        title,
        body: body || null,
        is_published: true,
      })
      .eq("id", id)
      .select("id, title, body")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let pushResult: PushResult | undefined;
    if (resend && shouldSendViaApi()) {
      pushResult = await sendPush({
        notification_id: row.id,
        title: row.title,
        body: row.body ?? "",
      });
    }

    return NextResponse.json({
      ok: true,
      notification_id: row.id,
      push: pushResult,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al editar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Borra una alerta. */
export async function DELETE(request: Request) {
  if (!verifyAdminExportToken(request)) return unauthorizedResponse();

  const url = new URL(request.url);
  let id = url.searchParams.get("id")?.trim() ?? "";

  if (!id) {
    try {
      const json = (await request.json()) as { id?: string };
      id = (json.id ?? "").trim();
    } catch {
      // ignore
    }
  }

  if (!id) {
    return NextResponse.json({ error: "Falta id" }, { status: 400 });
  }

  try {
    const sb = createSupabaseAdmin();
    const { error } = await sb.from("notifications").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, deleted: id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al borrar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
