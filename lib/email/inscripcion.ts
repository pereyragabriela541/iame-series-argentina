import nodemailer from "nodemailer";

const ORG_EMAIL = process.env.EMAIL_NOTIFY_TO ?? "iameseriesarg@gmail.com";
const FROM_EMAIL =
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

export function buildPilotEmail(data: InscripcionEmailData) {
  const subject = "Inscripción registrada — IAME Series Argentina";
  const text = [
    `Hola ${data.nombreCompleto},`,
    "",
    "REGISTRAMOS TU INSCRIPCIÓN EXITOSAMENTE.",
    "",
    "Resumen:",
    `- Fecha: ${data.roundLabel}`,
    `- Categoría: ${data.categoria}`,
    `- N° de kart: ${data.kartNumber}`,
    "",
    "Ahora podés elegir tu turno en administración desde la misma página de inscripción.",
    "",
    "Consultas: iameseriesarg@gmail.com",
    "",
    "IAME Series Argentina — BS Proyecta",
  ].join("\n");

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
      </ul>
      <p><strong>Próximo paso:</strong> elegí tu turno en administración en la web de inscripción.</p>
      <p style="font-size:13px;color:#5c6b7a">Consultas: <a href="mailto:iameseriesarg@gmail.com">iameseriesarg@gmail.com</a></p>
    </div>
  `;

  return { subject, text, html };
}

export function buildOrgEmail(data: InscripcionEmailData) {
  const subject = `Nueva inscripción — ${data.nombreCompleto} (${data.categoria})`;
  const rows: [string, string][] = [
    ["Piloto", data.nombreCompleto],
    ["DNI", data.dni],
    ["Email", data.email],
    ["Teléfono", data.phone || "—"],
    ["Categoría", data.categoria],
    ["N° Kart", data.kartNumber],
    ["Fecha", data.roundLabel],
    ["Equipo", data.team || "—"],
    ["Ciudad", data.city || "—"],
    ["Fecha nacimiento", data.birthDate || "—"],
    ["Round key", data.roundKey],
  ];

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
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[email] SMTP no configurado — EMAIL_SMTP_PASS faltante");
    return { pilot: false, org: false, skipped: true };
  }

  const pilot = buildPilotEmail(data);
  const org = buildOrgEmail(data);

  await transporter.sendMail({
    from: FROM_EMAIL,
    to: data.email,
    replyTo: ORG_EMAIL,
    subject: pilot.subject,
    text: pilot.text,
    html: pilot.html,
  });

  await transporter.sendMail({
    from: FROM_EMAIL,
    to: ORG_EMAIL,
    replyTo: data.email,
    subject: org.subject,
    text: org.text,
    html: org.html,
  });

  return { pilot: true, org: true, skipped: false };
}

export async function sendResendConfirmation(data: InscripcionEmailData) {
  const transporter = getTransporter();
  if (!transporter) {
    return { pilot: false, org: false, skipped: true };
  }

  const pilot = buildPilotEmail(data);
  const org = buildOrgEmail(data);

  await transporter.sendMail({
    from: FROM_EMAIL,
    to: data.email,
    replyTo: ORG_EMAIL,
    subject: `[Reenvío] ${pilot.subject}`,
    text: pilot.text,
    html: pilot.html,
  });

  await transporter.sendMail({
    from: FROM_EMAIL,
    to: ORG_EMAIL,
    replyTo: data.email,
    subject: `[Reenvío] ${org.subject}`,
    text: org.text,
    html: org.html,
  });

  return { pilot: true, org: true, skipped: false };
}
