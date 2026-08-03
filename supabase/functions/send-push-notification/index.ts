import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface PushPayload {
  notification_id?: string;
  title?: string;
  body?: string;
  // Formato opcional de Database Webhook de Supabase
  type?: string;
  table?: string;
  record?: {
    id?: string;
    title?: string;
    body?: string | null;
    is_published?: boolean;
  };
}

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  sound: "default";
  priority: "high";
  channelId: string;
  data: { screen: string; url: string; notification_id?: string };
}

function normalizePayload(raw: PushPayload): {
  notification_id?: string;
  title: string;
  body: string;
} | null {
  if (raw.record) {
    if (raw.record.is_published === false) return null;
    const title = (raw.record.title ?? raw.title ?? "").trim();
    if (!title) return null;
    return {
      notification_id: raw.record.id ?? raw.notification_id,
      title,
      body: (raw.record.body ?? raw.body ?? "").trim(),
    };
  }

  const title = (raw.title ?? "").trim();
  if (!title) return null;
  return {
    notification_id: raw.notification_id,
    title,
    body: (raw.body ?? "").trim(),
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const secret = Deno.env.get("PUSH_WEBHOOK_SECRET");
  const authHeader = req.headers.get("Authorization");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  const authorized =
    (secret && req.headers.get("x-push-secret") === secret) ||
    (serviceKey && authHeader === `Bearer ${serviceKey}`);

  if (!authorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let raw: PushPayload;
  try {
    raw = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = normalizePayload(raw);
  if (!payload) {
    return new Response(
      JSON.stringify({ sent: 0, message: "Nothing to send (unpublished or empty title)" }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: tokens, error: tokensError } = await supabase
    .from("push_tokens")
    .select("expo_push_token");

  if (tokensError) {
    return new Response(JSON.stringify({ error: tokensError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const uniqueTokens = [
    ...new Set((tokens ?? []).map((t) => t.expo_push_token).filter(Boolean)),
  ];

  if (!uniqueTokens.length) {
    return new Response(JSON.stringify({ sent: 0, message: "No tokens" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const messages: ExpoMessage[] = uniqueTokens.map((token) => ({
    to: token,
    title: payload.title,
    body: payload.body,
    sound: "default",
    priority: "high",
    // Debe coincidir con Notifications.setNotificationChannelAsync('alertas') en la app.
    channelId: "alertas",
    data: {
      screen: "alertas",
      url: "/(tabs)/alertas",
      notification_id: payload.notification_id,
    },
  }));

  let sent = 0;
  const errors: unknown[] = [];
  const ticketErrors: unknown[] = [];

  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(chunk),
    });
    const json = (await res.json().catch(() => null)) as {
      data?: Array<{ status?: string; message?: string; details?: unknown }>;
    } | null;

    if (!res.ok) {
      errors.push(json ?? { status: res.status });
      continue;
    }

    for (const ticket of json?.data ?? []) {
      if (ticket.status === "ok") {
        sent += 1;
      } else {
        ticketErrors.push(ticket);
      }
    }
  }

  return new Response(
    JSON.stringify({
      sent,
      tokens: uniqueTokens.length,
      title: payload.title,
      errors: errors.length ? errors : undefined,
      ticketErrors: ticketErrors.length ? ticketErrors : undefined,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
