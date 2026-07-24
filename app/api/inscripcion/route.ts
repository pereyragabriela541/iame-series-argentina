import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { uploadDuoPhoto } from "@/lib/inscription-duo-photos";
import {
  sendInscripcionEmails,
  type InscripcionEmailData,
} from "@/lib/email/inscripcion";
import { findRoundLabel, isDualPilotRound } from "@/lib/inscription-data";
import { normalizeDniKey } from "@/lib/turnos-utils";

export const runtime = "nodejs";

const PRIVACY_CONSENT_MESSAGE =
  "Debés aceptar la política de privacidad y los términos y condiciones.";

const PRIVACY_CONSENT_TEXT =
  "Autorizo a IAME Series Argentina (BS Proyect) al tratamiento de mis datos personales conforme a la política de privacidad y los términos y condiciones.";

type Body = Record<string, unknown>;

async function parseBody(request: Request): Promise<{
  body: Body;
  photoTitular: File | null;
  photoInvitado: File | null;
}> {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const fd = await request.formData();
    const body: Body = {};
    let photoTitular: File | null = null;
    let photoInvitado: File | null = null;
    for (const [key, value] of fd.entries()) {
      if (key === "photo_titular" && value instanceof File && value.size > 0) {
        photoTitular = value;
        continue;
      }
      if (key === "photo_invitado" && value instanceof File && value.size > 0) {
        photoInvitado = value;
        continue;
      }
      if (typeof value === "string") body[key] = value;
    }
    body.privacy_consent =
      body.privacy_consent === "on" ||
      body.privacy_consent === "true" ||
      body.privacy_consent === true;
    return { body, photoTitular, photoInvitado };
  }

  const body = (await request.json()) as Body;
  return { body, photoTitular: null, photoInvitado: null };
}

export async function POST(request: Request) {
  try {
    const { body, photoTitular, photoInvitado } = await parseBody(request);
    const dniKey = normalizeDniKey(String(body.dni ?? ""));
    const roundKey = String(body.round_key ?? body.round_id ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const dualPilot = isDualPilotRound(roundKey);
    const guestFullName = String(body.guest_full_name ?? "").trim();
    const guestDni = String(body.guest_dni ?? "").trim();
    const guestBirthDate = body.guest_birth_date
      ? String(body.guest_birth_date).trim()
      : "";
    const guestDniKey = guestDni ? normalizeDniKey(guestDni) : "";

    if (!dniKey || dniKey.length < 7) {
      return NextResponse.json({ error: "DNI inválido" }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }
    if (!body.privacy_consent) {
      return NextResponse.json({ error: PRIVACY_CONSENT_MESSAGE }, { status: 400 });
    }
    if (!roundKey) {
      return NextResponse.json({ error: "Seleccioná una fecha" }, { status: 400 });
    }
    if (dualPilot) {
      if (!String(body.full_name ?? "").trim()) {
        return NextResponse.json(
          { error: "Completá el nombre del piloto titular" },
          { status: 400 },
        );
      }
      if (!body.birth_date) {
        return NextResponse.json(
          { error: "Completá la fecha de nacimiento del titular" },
          { status: 400 },
        );
      }
      if (!guestFullName) {
        return NextResponse.json(
          { error: "Completá el nombre del piloto invitado" },
          { status: 400 },
        );
      }
      if (!guestDniKey || guestDniKey.length < 7) {
        return NextResponse.json(
          { error: "DNI del invitado inválido" },
          { status: 400 },
        );
      }
      if (!guestBirthDate) {
        return NextResponse.json(
          { error: "Completá la fecha de nacimiento del invitado" },
          { status: 400 },
        );
      }
      if (guestDniKey === dniKey) {
        return NextResponse.json(
          { error: "El DNI del titular y del invitado deben ser distintos" },
          { status: 400 },
        );
      }
      if (!photoTitular) {
        return NextResponse.json(
          { error: "Subí la foto del piloto titular" },
          { status: 400 },
        );
      }
      if (!photoInvitado) {
        return NextResponse.json(
          { error: "Subí la foto del piloto invitado" },
          { status: 400 },
        );
      }
    }

    const sb = createSupabaseAdmin();

    const { data: existing } = await sb
      .from("registrations")
      .select("id, email_confirmacion_enviada_at")
      .eq("round_key", roundKey)
      .eq("dni_key", dniKey)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error: "Ya existe una inscripción con este DNI para la fecha seleccionada.",
          registrationId: existing.id,
          alreadyRegistered: true,
        },
        { status: 409 },
      );
    }

    const roundLabel =
      String(body.round_label ?? "") ||
      findRoundLabel(roundKey, [{ value: roundKey, label: roundKey }]);

    const categoryLabel = String(body.category_label ?? body.category_slug ?? "");
    const folderKey = `${dniKey}_${guestDniKey || "solo"}`;

    let photoTitularUrl: string | undefined;
    let photoInvitadoUrl: string | undefined;
    if (dualPilot && photoTitular && photoInvitado) {
      photoTitularUrl = await uploadDuoPhoto({
        file: photoTitular,
        registrationKey: folderKey,
        role: "titular",
      });
      photoInvitadoUrl = await uploadDuoPhoto({
        file: photoInvitado,
        registrationKey: folderKey,
        role: "invitado",
      });
    }

    const payload = {
      round_id: body.round_id_uuid || null,
      round_key: roundKey,
      dni: String(body.dni).trim(),
      dni_key: dniKey,
      full_name: String(body.full_name).trim(),
      email,
      phone: String(body.phone ?? "").trim() || null,
      birth_date: body.birth_date || null,
      category_slug: String(body.category_slug ?? "").trim(),
      kart_number: String(body.kart_number ?? "").trim(),
      team: String(body.team ?? "").trim() || null,
      city: String(body.city ?? "").trim() || null,
      privacy_consent: true,
      privacy_consent_text: PRIVACY_CONSENT_TEXT,
      origen: "web",
      extra: {
        round_label: roundLabel,
        category_label: categoryLabel,
        ...(dualPilot
          ? {
              format: "titular_invitado",
              guest_full_name: guestFullName,
              guest_dni: guestDni,
              guest_dni_key: guestDniKey,
              guest_birth_date: guestBirthDate,
              photo_titular_url: photoTitularUrl,
              photo_invitado_url: photoInvitadoUrl,
              show_in_duos: true,
            }
          : {}),
      },
    };

    const { data: reg, error } = await sb
      .from("registrations")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const emailData: InscripcionEmailData = {
      nombreCompleto: payload.full_name,
      email,
      dni: payload.dni,
      categoria: categoryLabel,
      kartNumber: payload.kart_number,
      roundLabel,
      roundKey,
      phone: payload.phone ?? undefined,
      team: payload.team ?? undefined,
      city: payload.city ?? undefined,
      birthDate: payload.birth_date ? String(payload.birth_date) : undefined,
      ...(dualPilot
        ? {
            guestFullName,
            guestDni,
            guestBirthDate,
          }
        : {}),
    };

    const emailResult = await sendInscripcionEmails(emailData);

    if (!emailResult.skipped) {
      await sb
        .from("registrations")
        .update({
          email_confirmacion_enviada_at: new Date().toISOString(),
          email_organizacion_notificada_at: new Date().toISOString(),
        })
        .eq("id", reg.id);
    }

    return NextResponse.json({
      ok: true,
      registrationId: reg.id,
      emailSent: emailResult.pilot,
      emailSkipped: emailResult.skipped,
      message: emailResult.skipped
        ? "Inscripción guardada. Configurá RESEND_API_KEY (recomendado) o EMAIL_SMTP_PASS."
        : "Tu inscripción aún no está completa. Para confirmarla, debés reservar tu turno y finalizar el trámite de manera presencial.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dni = searchParams.get("dni");
  const roundKey = searchParams.get("round_key");

  if (!dni || !roundKey) {
    return NextResponse.json({ error: "Parámetros faltantes" }, { status: 400 });
  }

  try {
    const sb = createSupabaseAdmin();
    const dniKey = normalizeDniKey(dni);

    const { data } = await sb
      .from("registrations")
      .select("id, full_name, email, kart_number, category_slug, email_confirmacion_enviada_at")
      .eq("round_key", roundKey)
      .eq("dni_key", dniKey)
      .maybeSingle();

    return NextResponse.json({ exists: !!data, registration: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
