import nodemailer from "nodemailer";
import { Resend } from "resend";
import { BRAND } from "@/lib/branding";
import { SITE_URL } from "@/lib/site";

const ORG_EMAIL = process.env.EMAIL_NOTIFY_TO ?? "iameseriesarg@gmail.com";
const FROM_RESEND =
  process.env.EMAIL_FROM ??
  "IAME Series Argentina <registracion@bsproyect.com>";
const FROM_SMTP =
  process.env.EMAIL_FROM ??
  `IAME Series Argentina <iameseriesarg@gmail.com>`;

export interface InscripcionEmailData {
  nombreCompleto: string;
  email: string;
  dni: string;
  categoria: string;
  kartNumber: string;
  roundLabel: string;
  roundKey: string;
  phone?: string;
  team?: string;
  city?: string;
  birthDate?: string;
  guestFullName?: string;
  guestDni?: string;
  guestBirthDate?: string;
}

interface OutboundMail {
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
}

function escapeHtml(value: string): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getTransporter() {
  const user = process.env.EMAIL_SMTP_USER ?? "iameseriesarg@gmail.com";
  const pass = process.env.EMAIL_SMTP_PASS ?? "";

  if (!pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.EMAIL_SMTP_PORT ?? 587),
    secure: process.env.EMAIL_SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY || process.env.EMAIL_SMTP_PASS);
}

async function sendMail(mail: OutboundMail) {
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: FROM_RESEND,
      to: mail.to,
      replyTo: mail.replyTo,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });

    if (error) {
      console.error("[email/resend]", error);
      throw new Error(error.message);
    }

    return { provider: "resend" as const, messageId: data?.id };
  }

  const transporter = getTransporter();
  if (!transporter) {
    throw new Error("EMAIL no configurado");
  }

  const info = await transporter.sendMail({
    from: FROM_SMTP,
    to: mail.to,
    replyTo: mail.replyTo,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });

  return { provider: "smtp" as const, messageId: info.messageId };
}

export function buildPilotEmail(data: InscripcionEmailData) {
  const subject = "Inscripción registrada — IAME Series Argentina";
  const guestLines = data.guestFullName
    ? [
        `- Piloto titular: ${data.nombreCompleto}`,
        `- Piloto invitado: ${data.guestFullName}`,
      ]
    : [];
  const text = [
    `Hola ${data.nombreCompleto},`,
    "",
    "REGISTRAMOS TU INSCRIPCIÓN EXITOSAMENTE.",
    "",
    "Resumen:",
    `- Fecha: ${data.roundLabel}`,
    `- Categoría: ${data.categoria}`,
    `- N° de kart: ${data.kartNumber}`,
    ...guestLines,
    "",
    "Ahora podés elegir tu turno en administración desde la misma página de inscripción.",
    "",
    `Consultas: ${BRAND.email}`,
    "",
    "IAME Series Argentina — BS Proyect",
  ].join("\n");

  const guestHtml = data.guestFullName
    ? `<li>Piloto titular: ${escapeHtml(data.nombreCompleto)}</li>
        <li>Piloto invitado: ${escapeHtml(data.guestFullName)}</li>`
    : "";

  const html = `
    <div style="font-family:Arial,sans-serif;color:#1f2d3d;line-height:1.6;max-width:560px">
      <h2 style="color:#004A99;margin:0 0 12px">Inscripción registrada</h2>
      <p>Hola <strong>${escapeHtml(data.nombreCompleto)}</strong>,</p>
      <p style="background:#ecfdf5;border:1px solid #86efac;border-radius:8px;padding:14px;font-weight:700;color:#166534">
        Registramos tu inscripción exitosamente.
      </p>
      <ul>
        <li>Fecha: ${escapeHtml(data.roundLabel)}</li>
        <li>Categoría: ${escapeHtml(data.categoria)}</li>
        <li>N° de kart: ${escapeHtml(data.kartNumber)}</li>
        ${guestHtml}
      </ul>
      <p><strong>Próximo paso:</strong> elegí tu turno en administración en la web de inscripción.</p>
      <p style="font-size:13px;color:#5c6b7a">Consultas: <a href="mailto:${BRAND.email}">${BRAND.email}</a></p>
    </div>
  `;

  return { subject, text, html };
}

function eventoCierreKba(roundKey?: string): string {
  if (roundKey === "fecha-5") {
    return ", donde despediremos al histórico Kartódromo de Buenos Aires";
  }
  return "";
}

/** Mail al piloto: inscripción registrada pero falta reservar turno. */
export function buildInscripcionPendienteEmail(data: {
  nombreCompleto: string;
  eventoNombre: string;
  roundKey?: string;
}) {
  const evento = data.eventoNombre.trim() || "IAME Series Argentina";
  const cierre = eventoCierreKba(data.roundKey);
  const inscripcionUrl = `${SITE_URL}/inscripcion`;
  const subject = "⚠️ Inscripción no finalizada — IAME Series Argentina";

  const text = [
    `Hola ${data.nombreCompleto},`,
    "",
    "⚠️ Inscripción no finalizada",
    "",
    `Tu inscripción aún no está completa. Para confirmarla, debés reservar tu turno y finalizar el trámite de manera presencial para la ${evento}${cierre}.`,
    "",
    "¡Te esperamos!",
    "",
    `Reservá tu turno en: ${inscripcionUrl}`,
    "",
    `Consultas: ${BRAND.email}`,
    "",
    "IAME Series Argentina — BS Proyect",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#1f2d3d;line-height:1.6;max-width:560px">
      <h2 style="color:#E30613;margin:0 0 12px">⚠️ Inscripción no finalizada</h2>
      <p>Hola <strong>${escapeHtml(data.nombreCompleto)}</strong>,</p>
      <p style="background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:14px;font-weight:600;color:#9a3412">
        Tu inscripción aún no está completa. Para confirmarla, debés reservar tu turno y finalizar el trámite de manera presencial para la <strong>${escapeHtml(evento)}</strong>${escapeHtml(cierre)}.
      </p>
      <p style="font-size:16px;font-weight:700;color:#004A99">¡Te esperamos!</p>
      <p>
        <a href="${inscripcionUrl}"
           style="display:inline-block;background:#004A99;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">
          Reservar mi turno
        </a>
      </p>
      <p style="font-size:13px;color:#5c6b7a">Consultas: <a href="mailto:${BRAND.email}">${BRAND.email}</a></p>
    </div>
  `;

  return { subject, text, html };
}

export function buildOrgEmail(data: InscripcionEmailData) {
  const subject = `Nueva inscripción — ${data.nombreCompleto} (${data.categoria})`;
  const rows: [string, string][] = [
    [data.guestFullName ? "Piloto titular" : "Piloto", data.nombreCompleto],
    [data.guestFullName ? "DNI titular" : "DNI", data.dni],
    [
      data.guestFullName ? "Nac. titular" : "Fecha nacimiento",
      data.birthDate || "—",
    ],
  ];

  if (data.guestFullName) {
    rows.push(
      ["Piloto invitado", data.guestFullName],
      ["DNI invitado", data.guestDni || "—"],
      ["Nac. invitado", data.guestBirthDate || "—"],
    );
  }

  rows.push(
    ["Email", data.email],
    ["Teléfono", data.phone || "—"],
    ["Categoría", data.categoria],
    ["N° Kart", data.kartNumber],
    ["Fecha", data.roundLabel],
    ["Equipo", data.team || "—"],
    ["Ciudad", data.city || "—"],
    ["Round key", data.roundKey],
  );

  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px;font-weight:700">${escapeHtml(label)}</td><td style="padding:8px">${escapeHtml(value)}</td></tr>`
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px">
      <h2 style="color:#E30613">Nueva inscripción — IAME Series Argentina</h2>
      <table style="width:100%;border-collapse:collapse">${tableRows}</table>
    </div>
  `;

  return { subject, text, html };
}

export async function sendInscripcionEmails(data: InscripcionEmailData) {
  if (!isEmailConfigured()) {
    console.warn("[email] Sin RESEND_API_KEY ni EMAIL_SMTP_PASS");
    return { pilot: false, org: false, skipped: true, provider: null };
  }

  const pilot = buildInscripcionPendienteEmail({
    nombreCompleto: data.nombreCompleto,
    eventoNombre: data.roundLabel,
    roundKey: data.roundKey,
  });
  const org = buildOrgEmail(data);

  const pilotResult = await sendMail({
    to: data.email,
    replyTo: ORG_EMAIL,
    subject: pilot.subject,
    text: pilot.text,
    html: pilot.html,
  });

  await sendMail({
    to: ORG_EMAIL,
    replyTo: data.email,
    subject: org.subject,
    text: org.text,
    html: org.html,
  });

  return {
    pilot: true,
    org: true,
    skipped: false,
    provider: pilotResult.provider,
  };
}

export async function sendResendConfirmation(data: InscripcionEmailData) {
  if (!isEmailConfigured()) {
    return { pilot: false, org: false, skipped: true, provider: null };
  }

  const pilot = buildInscripcionPendienteEmail({
    nombreCompleto: data.nombreCompleto,
    eventoNombre: data.roundLabel,
    roundKey: data.roundKey,
  });
  const org = buildOrgEmail(data);

  const pilotResult = await sendMail({
    to: data.email,
    replyTo: ORG_EMAIL,
    subject: `[Reenvío] ${pilot.subject}`,
    text: pilot.text,
    html: pilot.html,
  });

  await sendMail({
    to: ORG_EMAIL,
    replyTo: data.email,
    subject: `[Reenvío] ${org.subject}`,
    text: org.text,
    html: org.html,
  });

  return {
    pilot: true,
    org: true,
    skipped: false,
    provider: pilotResult.provider,
  };
}

export function isMicrosoftMailbox(email: string) {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return (
    domain.endsWith("live.com") ||
    domain.endsWith("hotmail.com") ||
    domain.endsWith("outlook.com") ||
    domain.endsWith("outlook.com.ar") ||
    domain.endsWith("hotmail.com.ar")
  );
}

export interface TurnoEmailData {
  nombreCompleto: string;
  email: string;
  codigo: string;
  fecha: string;
  hora: string;
  horaFin: string;
  eventoNombre?: string | null;
}

function formatFechaEmail(fechaISO: string): string {
  const raw = String(fechaISO || "").slice(0, 10);
  const [y, mo, d] = raw.split("-").map(Number);
  if (!y || !mo || !d) return raw || fechaISO;
  return new Date(y, mo - 1, d).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function buildTurnoPilotEmail(data: TurnoEmailData) {
  const fechaFmt = formatFechaEmail(data.fecha);
  const evento = data.eventoNombre?.trim() || "IAME Series Argentina";
  const subject = `Turno confirmado — ${data.codigo}`;

  const text = [
    `Hola ${data.nombreCompleto},`,
    "",
    "TU TURNO DE ADMINISTRACIÓN FUE CONFIRMADO.",
    "",
    `Código: ${data.codigo}`,
    `Evento: ${evento}`,
    `Día: ${fechaFmt}`,
    `Horario: ${data.hora} — ${data.horaFin}`,
    "",
    "Guardá este código y presentalo en administración.",
    "",
    `Consultas: ${BRAND.email}`,
    "",
    "IAME Series Argentina — BS Proyect",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#1f2d3d;line-height:1.6;max-width:560px">
      <h2 style="color:#004A99;margin:0 0 12px">Turno confirmado</h2>
      <p>Hola <strong>${escapeHtml(data.nombreCompleto)}</strong>,</p>
      <p style="background:#ecfdf5;border:1px solid #86efac;border-radius:8px;padding:14px;font-weight:700;color:#166534">
        Tu turno de administración fue confirmado.
      </p>
      <p style="font-size:28px;font-weight:700;letter-spacing:2px;font-family:monospace;margin:16px 0">
        ${escapeHtml(data.codigo)}
      </p>
      <ul>
        <li>Evento: ${escapeHtml(evento)}</li>
        <li>Día: ${escapeHtml(fechaFmt)}</li>
        <li>Horario: ${escapeHtml(data.hora)} — ${escapeHtml(data.horaFin)}</li>
      </ul>
      <p style="font-size:13px;color:#5c6b7a">Guardá este código y presentalo en administración.</p>
      <p style="font-size:13px;color:#5c6b7a">Consultas: <a href="mailto:${BRAND.email}">${BRAND.email}</a></p>
    </div>
  `;

  return { subject, text, html };
}

/** Mail al piloto cuando reserva turno. No falla la reserva si el envío falla. */
export async function sendTurnoConfirmacionEmail(data: TurnoEmailData) {
  if (!isEmailConfigured()) {
    console.warn("[email/turno] Sin RESEND_API_KEY ni EMAIL_SMTP_PASS");
    return { sent: false, skipped: true, provider: null as string | null };
  }

  if (!data.email?.trim()) {
    console.warn("[email/turno] Reserva sin email de piloto");
    return { sent: false, skipped: true, provider: null as string | null };
  }

  const pilot = buildTurnoPilotEmail(data);
  const result = await sendMail({
    to: data.email.trim().toLowerCase(),
    replyTo: ORG_EMAIL,
    subject: pilot.subject,
    text: pilot.text,
    html: pilot.html,
  });

  return {
    sent: true,
    skipped: false,
    provider: result.provider,
  };
}
