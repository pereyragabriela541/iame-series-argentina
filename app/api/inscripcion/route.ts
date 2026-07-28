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
/** Subida de 2 fotos + emails: evitar corte prematuro en serverless. */
export const maxDuration = 60;

const PRIVACY_CONSENT_MESSAGE =
  "Debés aceptar la política de privacidad y los términos y condiciones.";

const PRIVACY_CONSENT_TEXT =
  "Autorizo a IAME Series Argentina (BS Proyect) al tratamiento de mis datos personales (y, si corresponde, del piloto invitado y de las fotografías cargadas, inclusive su publicación en Noticias) conforme a la política de privacidad y los términos y condiciones.";

type Body = Record<string, unknown>;

function mapRegistrationResponse(data: {
  id: string;
  full_name: string;
  email: string;
  dni: string;
  round_key: string;
  kart_number: string | null;
  category_slug: string | null;
  extra: unknown;
}) {
  const extra = (data.extra as Record<string, string> | null) ?? {};
  return {
    registrationId: data.id,
    roundKey: data.round_key,
    roundLabel: extra.round_label ?? data.round_key,
    dni: data.dni,
    email: data.email,
    fullName: data.full_name,
    kartNumber: data.kart_number,
    categorySlug: data.category_slug,
    categoryLabel: extra.category_label ?? data.category_slug,
    dualPilot: extra.format === "titular_invitado",
    photoTitularUrl: extra.photo_titular_url || null,
    photoInvitadoUrl: extra.photo_invitado_url || null,
    guestFullName: extra.guest_full_name || null,
  };
}

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
      .select(
        "id, full_name, email, dni, round_key, kart_number, category_slug, extra, email_confirmacion_enviada_at"
      )
      .eq("round_key", roundKey)
      .eq("dni_key", dniKey)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error:
            "Ya existe una inscripción con este DNI para la fecha seleccionada.",
          registrationId: existing.id,
          alreadyRegistered: true,
          registration: mapRegistrationResponse(existing),
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
      [photoTitularUrl, photoInvitadoUrl] = await Promise.all([
        uploadDuoPhoto({
          file: photoTitular,
          registrationKey: folderKey,
          role: "titular",
        }),
        uploadDuoPhoto({
          file: photoInvitado,
          registrationKey: folderKey,
          role: "invitado",
        }),
      ]);
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
      registrationId: reg.id,
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

    let emailResult: Awaited<ReturnType<typeof sendInscripcionEmails>> = {
      pilot: false,
      org: false,
      skipped: true,
      provider: null,
    };
    try {
      emailResult = await sendInscripcionEmails(emailData);
    } catch (emailErr) {
      console.error("[inscripcion] email:", emailErr);
      emailResult = {
        pilot: false,
        org: false,
        skipped: true,
        provider: null,
      };
    }

    if (!emailResult.skipped && emailResult.pilot) {
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
      emailSkipped: emailResult.skipped || !emailResult.pilot,
      photoTitularUrl: photoTitularUrl ?? null,
      photoInvitadoUrl: photoInvitadoUrl ?? null,
      dualPilot,
      message: emailResult.skipped || !emailResult.pilot
        ? "Inscripción guardada. El email de confirmación no pudo enviarse; reservá tu turno igual."
        : "Tu inscripción aún no está completa. Para confirmarla, debés reservar tu turno y finalizar el trámite de manera presencial.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const registrationId = searchParams.get("id")?.trim() ?? "";
  const codigo = String(searchParams.get("codigo") ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  const dni = searchParams.get("dni");
  const roundKey = searchParams.get("round_key");

  try {
    const sb = createSupabaseAdmin();

    if (codigo) {
      const { data: reserva, error: reservaError } = await sb
        .from("reservas_turnos")
        .select("registration_id, codigo")
        .eq("codigo", codigo)
        .maybeSingle();

      if (reservaError) {
        return NextResponse.json({ error: reservaError.message }, { status: 500 });
      }
      if (!reserva?.registration_id) {
        return NextResponse.json(
          { error: "No encontramos un turno con ese código." },
          { status: 404 },
        );
      }

      const { data, error } = await sb
        .from("registrations")
        .select(
          "id, full_name, email, dni, round_key, kart_number, category_slug, extra, email_confirmacion_enviada_at"
        )
        .eq("id", reserva.registration_id)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (!data) {
        return NextResponse.json(
          { error: "Inscripción no encontrada para ese código." },
          { status: 404 },
        );
      }

      return NextResponse.json({
        exists: true,
        canEditPhotos: true,
        codigo: reserva.codigo,
        registration: mapRegistrationResponse(data),
      });
    }

    if (registrationId) {
      const { data, error } = await sb
        .from("registrations")
        .select(
          "id, full_name, email, dni, round_key, kart_number, category_slug, extra, email_confirmacion_enviada_at"
        )
        .eq("id", registrationId)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (!data) {
        return NextResponse.json({ error: "Inscripción no encontrada" }, { status: 404 });
      }

      return NextResponse.json({
        exists: true,
        canEditPhotos: false,
        registration: mapRegistrationResponse(data),
      });
    }

    if (!dni || !roundKey) {
      return NextResponse.json({ error: "Parámetros faltantes" }, { status: 400 });
    }

    const dniKey = normalizeDniKey(dni);

    const { data, error } = await sb
      .from("registrations")
      .select(
        "id, full_name, email, dni, round_key, kart_number, category_slug, extra, email_confirmacion_enviada_at"
      )
      .eq("round_key", roundKey)
      .eq("dni_key", dniKey)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ exists: false, registration: null, canEditPhotos: false });
    }

    return NextResponse.json({
      exists: true,
      canEditPhotos: false,
      registration: mapRegistrationResponse(data),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
