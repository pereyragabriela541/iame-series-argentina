/**
 * Envía recordatorio a inscriptos que aún no reservaron turno.
 * Uso: node scripts/recordatorio-sin-turno.mjs
 * Opcional: ROUND_KEY=fecha-5 node scripts/recordatorio-sin-turno.mjs
 * Dry-run: DRY_RUN=1 node scripts/recordatorio-sin-turno.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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
const resendKey = process.env.RESEND_API_KEY;

if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (!resendKey && !process.env.DRY_RUN) {
  console.error("Falta RESEND_API_KEY (o usá DRY_RUN=1 para solo listar)");
  process.exit(1);
}

const roundKey = process.env.ROUND_KEY?.trim() || "fecha-5";
const dryRun = process.env.DRY_RUN === "1";
const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.bsproyect.com"
).replace(/\/$/, "");
const inscripcionUrlBase = `${siteUrl}/inscripcion`;

const sb = createClient(url, key);

const { data: regs, error: regsErr } = await sb
  .from("registrations")
  .select("id, dni_key, full_name, email, round_key, extra")
  .eq("round_key", roundKey);

if (regsErr) {
  console.error(regsErr.message);
  process.exit(1);
}

const { data: reservas, error: resErr } = await sb
  .from("reservas_turnos")
  .select("dni_key")
  .eq("round_key", roundKey);

if (resErr) {
  console.error(resErr.message);
  process.exit(1);
}

const reservedDni = new Set((reservas ?? []).map((r) => r.dni_key));

const pendientes = (regs ?? []).filter(
  (r) => r.email && String(r.email).includes("@") && !reservedDni.has(r.dni_key),
);

const { data: cfg } = await sb
  .from("turnos_config")
  .select("evento_nombre")
  .eq("round_key", roundKey)
  .maybeSingle();

const eventoNombre =
  cfg?.evento_nombre || "Fecha 5 de IAME Series Argentina";

console.log(
  `Inscriptos sin turno (${roundKey}): ${pendientes.length} de ${regs?.length ?? 0} total`,
);

if (!pendientes.length) {
  console.log("Nada que enviar.");
  process.exit(0);
}

function buildEmail(nombreCompleto, registrationId) {
  const inscripcionUrl = registrationId
    ? `${inscripcionUrlBase}?rid=${encodeURIComponent(registrationId)}`
    : inscripcionUrlBase;
  const subject = "⚠️ Inscripción no finalizada — IAME Series Argentina";
  const text = [
    `Hola ${nombreCompleto},`,
    "",
    "⚠️ Inscripción no finalizada",
    "",
    `Tu inscripción aún no está completa. Para confirmarla, debés reservar tu turno y finalizar el trámite de manera presencial para la ${eventoNombre}, donde despediremos al histórico Kartódromo de Buenos Aires.`,
    "",
    "¡Te esperamos!",
    "",
    `Reservá tu turno en: ${inscripcionUrl}`,
    "",
    "IAME Series Argentina — BS Proyect",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#1f2d3d;line-height:1.6;max-width:560px">
      <h2 style="color:#E30613;margin:0 0 12px">⚠️ Inscripción no finalizada</h2>
      <p>Hola <strong>${escapeHtml(nombreCompleto)}</strong>,</p>
      <p style="background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:14px;font-weight:600;color:#9a3412">
        Tu inscripción aún no está completa. Para confirmarla, debés reservar tu turno y finalizar el trámite de manera presencial para la <strong>${escapeHtml(eventoNombre)}</strong>, donde despediremos al histórico Kartódromo de Buenos Aires.
      </p>
      <p style="font-size:16px;font-weight:700;color:#004A99">¡Te esperamos!</p>
      <p>
        <a href="${inscripcionUrl}"
           style="display:inline-block;background:#004A99;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">
          Reservar mi turno
        </a>
      </p>
    </div>
  `;

  return { subject, text, html };
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendOne(reg) {
  const nombre = reg.full_name || "Piloto";
  const email = String(reg.email).trim().toLowerCase();
  const mail = buildEmail(nombre, reg.id);

  if (dryRun) {
    console.log(`[DRY] ${nombre} → ${email}`);
    return { sent: false, dry: true };
  }

  const { Resend } = await import("resend");
  const resend = new Resend(resendKey);
  const from =
    process.env.EMAIL_FROM ??
    "IAME Series Argentina <registracion@bsproyect.com>";
  const replyTo = process.env.EMAIL_NOTIFY_TO ?? "iameseriesarg@gmail.com";

  const { error: sendErr } = await resend.emails.send({
    from,
    to: email,
    replyTo,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });

  if (sendErr) throw new Error(sendErr.message);
  return { sent: true };
}

let ok = 0;
let fail = 0;

for (const reg of pendientes) {
  try {
    const result = await sendOne(reg);
    if (result.dry) continue;
    ok += 1;
    console.log(`✓ ${reg.full_name} → ${reg.email}`);
  } catch (e) {
    fail += 1;
    console.error(
      `✗ ${reg.full_name} → ${reg.email}:`,
      e instanceof Error ? e.message : e,
    );
  }
  await new Promise((r) => setTimeout(r, 400));
}

console.log(
  dryRun
    ? `Dry-run listo. ${pendientes.length} destinatarios.`
    : `Listo. Enviados: ${ok}. Fallidos: ${fail}.`,
);
