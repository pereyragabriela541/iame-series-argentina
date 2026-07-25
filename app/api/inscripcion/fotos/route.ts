import { NextResponse } from "next/server";
import {
  deleteDuoPhoto,
  uploadDuoPhoto,
} from "@/lib/inscription-duo-photos";
import { isDualPilotRound } from "@/lib/inscription-data";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Extra = Record<string, unknown>;

function normalizeCodigo(raw: string): string {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

export async function PATCH(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Usá multipart/form-data" },
        { status: 400 },
      );
    }

    const fd = await request.formData();
    const codigo = normalizeCodigo(String(fd.get("codigo") ?? ""));
    if (!codigo) {
      return NextResponse.json(
        {
          error:
            "Para editar fotos ingresá el código de tu turno (ej. IAME-XXXX).",
        },
        { status: 401 },
      );
    }

    const photoTitular =
      fd.get("photo_titular") instanceof File &&
      (fd.get("photo_titular") as File).size > 0
        ? (fd.get("photo_titular") as File)
        : null;
    const photoInvitado =
      fd.get("photo_invitado") instanceof File &&
      (fd.get("photo_invitado") as File).size > 0
        ? (fd.get("photo_invitado") as File)
        : null;
    const removeTitular =
      fd.get("remove_photo_titular") === "1" ||
      fd.get("remove_titular") === "1";
    const removeInvitado =
      fd.get("remove_photo_invitado") === "1" ||
      fd.get("remove_invitado") === "1";

    if (!photoTitular && !photoInvitado && !removeTitular && !removeInvitado) {
      return NextResponse.json(
        { error: "No hay cambios de foto" },
        { status: 400 },
      );
    }

    const sb = createSupabaseAdmin();

    const { data: reserva, error: reservaError } = await sb
      .from("reservas_turnos")
      .select("registration_id, round_key, dni_key, codigo, estado")
      .eq("codigo", codigo)
      .maybeSingle();

    if (reservaError) {
      return NextResponse.json({ error: reservaError.message }, { status: 500 });
    }
    if (!reserva?.registration_id) {
      return NextResponse.json(
        { error: "Código de turno inválido o sin inscripción asociada." },
        { status: 403 },
      );
    }

    const registrationId = String(fd.get("registration_id") ?? "").trim();
    if (registrationId && registrationId !== reserva.registration_id) {
      return NextResponse.json(
        { error: "El código no corresponde a esta inscripción." },
        { status: 403 },
      );
    }

    const { data: reg, error } = await sb
      .from("registrations")
      .select("id, dni_key, round_key, extra")
      .eq("id", reserva.registration_id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!reg) {
      return NextResponse.json(
        { error: "Inscripción no encontrada" },
        { status: 404 },
      );
    }
    if (!isDualPilotRound(reg.round_key)) {
      return NextResponse.json(
        { error: "Esta inscripción no admite fotos de dúo" },
        { status: 400 },
      );
    }

    const extra = { ...((reg.extra as Extra | null) ?? {}) };
    const guestDniKey = String(extra.guest_dni_key ?? "").trim();
    const folderKey = `${reg.dni_key}_${guestDniKey || "solo"}`;

    if (removeTitular && !photoTitular) {
      await deleteDuoPhoto({ registrationKey: folderKey, role: "titular" });
      delete extra.photo_titular_url;
    }
    if (removeInvitado && !photoInvitado) {
      await deleteDuoPhoto({ registrationKey: folderKey, role: "invitado" });
      delete extra.photo_invitado_url;
    }

    if (photoTitular) {
      extra.photo_titular_url = await uploadDuoPhoto({
        file: photoTitular,
        registrationKey: folderKey,
        role: "titular",
      });
    }
    if (photoInvitado) {
      extra.photo_invitado_url = await uploadDuoPhoto({
        file: photoInvitado,
        registrationKey: folderKey,
        role: "invitado",
      });
    }

    const hasBoth =
      Boolean(String(extra.photo_titular_url ?? "").trim()) &&
      Boolean(String(extra.photo_invitado_url ?? "").trim());
    extra.show_in_duos = hasBoth;

    const { error: updateError } = await sb
      .from("registrations")
      .update({ extra })
      .eq("id", reg.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      photoTitularUrl: String(extra.photo_titular_url ?? "") || null,
      photoInvitadoUrl: String(extra.photo_invitado_url ?? "") || null,
      showInDuos: hasBoth,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
