/**
 * Reenvía el mail de confirmación de turno a reservas ya existentes.
 * Uso: node scripts/resend-turno-emails.mjs
 * Opcional: ROUND_KEY=fecha-5 node scripts/resend-turno-emails.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  try {
    const raw = readFileSync(join(root, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const { sendTurnoConfirmacionEmail } = await import(
  pathToFileURL(join(root, "lib/email/inscripcion.ts")).href
).catch(async () => {
  // Fallback: cargar lógica mínima vía dynamic import no funciona con TS en node puro.
  // Usamos el mismo envío inline con Resend.
  return { sendTurnoConfirmacionEmail: null };
});

const sb = createClient(url, key);
const roundFilter = process.env.ROUND_KEY?.trim() || null;

let query = sb
  .from("reservas_turnos")
  .select(
    "id, codigo, fecha, hora, hora_fin, email, full_name, ubicacion, instrucciones, round_key, category_slug, kart_number, estado",
  )
  .order("created_at");

if (roundFilter) query = query.eq("round_key", roundFilter);

const { data: reservas, error } = await query;
if (error) {
  console.error(error.message);
  process.exit(1);
}

const { data: configs } = await sb
  .from("turnos_config")
  .select("round_key, evento_nombre, ubicacion, instrucciones");

const configByKey = Object.fromEntries(
  (configs ?? []).map((c) => [c.round_key, c]),
);

const list = (reservas ?? []).filter((r) => r.email && String(r.email).includes("@"));
console.log(`Enviando ${list.length} mails de turno${roundFilter ? ` (${roundFilter})` : ""}...`);

async function sendOne(r) {
  const cfg = configByKey[r.round_key] ?? {};
  const payload = {
    nombreCompleto: r.full_name || "Piloto",
    email: r.email,
    codigo: r.codigo,
    fecha: String(r.fecha).slice(0, 10),
    hora: r.hora,
    horaFin: r.hora_fin,
    eventoNombre: cfg.evento_nombre || r.round_key,
  };

  if (sendTurnoConfirmacionEmail) {
    return sendTurnoConfirmacionEmail(payload);
  }

  // Inline Resend fallback (mismo contenido que buildTurnoPilotEmail)
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from =
    process.env.EMAIL_FROM ??
    "IAME Series Argentina <registracion@bsproyect.com>";
  const org = process.env.EMAIL_NOTIFY_TO ?? "iameseriesarg@gmail.com";

  const [y, mo, d] = payload.fecha.split("-").map(Number);
  const fechaFmt = new Date(y, mo - 1, d).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const evento = payload.eventoNombre || "IAME Series Argentina";
  const subject = `Turno confirmado — ${payload.codigo}`;
  const text = [
    `Hola ${payload.nombreCompleto},`,
    "",
    "TU TURNO DE ADMINISTRACIÓN FUE CONFIRMADO.",
    "",
    `Código: ${payload.codigo}`,
    `Evento: ${evento}`,
    `Día: ${fechaFmt}`,
    `Horario: ${payload.hora} — ${payload.horaFin}`,
    "",
    "Guardá este código y presentalo en administración.",
    "",
    `Consultas: ${org}`,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#1f2d3d;line-height:1.6;max-width:560px">
      <h2 style="color:#004A99;margin:0 0 12px">Turno confirmado</h2>
      <p>Hola <strong>${payload.nombreCompleto}</strong>,</p>
      <p style="background:#ecfdf5;border:1px solid #86efac;border-radius:8px;padding:14px;font-weight:700;color:#166534">
        Tu turno de administración fue confirmado.
      </p>
      <p style="font-size:28px;font-weight:700;letter-spacing:2px;font-family:monospace;margin:16px 0">
        ${payload.codigo}
      </p>
      <ul>
        <li>Evento: ${evento}</li>
        <li>Día: ${fechaFmt}</li>
        <li>Horario: ${payload.hora} — ${payload.horaFin}</li>
      </ul>
      <p style="font-size:13px;color:#5c6b7a">Guardá este código y presentalo en administración.</p>
    </div>
  `;

  const { error: sendErr } = await resend.emails.send({
    from,
    to: payload.email.trim().toLowerCase(),
    replyTo: org,
    subject,
    text,
    html,
  });
  if (sendErr) throw new Error(sendErr.message);
  return { sent: true };
}

let ok = 0;
let fail = 0;
for (const r of list) {
  try {
    await sendOne(r);
    ok += 1;
    console.log(`✓ ${r.codigo} → ${r.email}`);
  } catch (e) {
    fail += 1;
    console.error(`✗ ${r.codigo} → ${r.email}:`, e instanceof Error ? e.message : e);
  }
  // Evitar rate limit de Resend
  await new Promise((r) => setTimeout(r, 400));
}

console.log(`Listo. Enviados: ${ok}. Fallidos: ${fail}.`);
