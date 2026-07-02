import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { sendResendConfirmation } from "@/lib/email/inscripcion";
import { resolveRoundKey } from "@/lib/round-keys";
import { normalizeDniKey } from "@/lib/turnos-utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const dniKey = normalizeDniKey(body.dni);
    const roundKey = String(body.round_key ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!dniKey || !roundKey || !email) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const sb = createSupabaseAdmin();
    const configKey = await resolveRoundKey(sb, roundKey);

    const { data: reg } = await sb
      .from("registrations")
      .select("*")
      .eq("dni_key", dniKey)
      .in("round_key", [roundKey, configKey])
      .maybeSingle();

    if (!reg) {
      return NextResponse.json(
        { error: "No encontramos inscripción con ese DNI y fecha." },
        { status: 404 }
      );
    }

    if (reg.email?.toLowerCase() !== email) {
      return NextResponse.json(
        { error: "El email no coincide con la inscripción." },
        { status: 403 }
      );
    }

    const extra = (reg.extra as Record<string, string>) ?? {};

    const result = await sendResendConfirmation({
      nombreCompleto: reg.full_name,
      email: reg.email,
      dni: reg.dni,
      categoria: extra.category_label ?? reg.category_slug ?? "",
      kartNumber: reg.kart_number ?? "",
      roundLabel: extra.round_label ?? roundKey,
      roundKey: reg.round_key ?? configKey,
      phone: reg.phone ?? undefined,
      team: reg.team ?? undefined,
      city: reg.city ?? undefined,
      birthDate: reg.birth_date ?? undefined,
    });

    if (result.skipped) {
      return NextResponse.json({
        ok: false,
        message: "SMTP no configurado. Agregá EMAIL_SMTP_PASS en .env.local",
      });
    }

    await sb
      .from("registrations")
      .update({
        email_confirmacion_enviada_at: new Date().toISOString(),
        email_organizacion_notificada_at: new Date().toISOString(),
      })
      .eq("id", reg.id);

    return NextResponse.json({
      ok: true,
      message:
        "Emails reenviados al piloto y a iameseriesarg@gmail.com con el detalle de la inscripción.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
