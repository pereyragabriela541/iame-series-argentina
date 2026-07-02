import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { resolveRoundKey } from "@/lib/round-keys";
import { generateCodigoReserva, normalizeDniKey } from "@/lib/turnos-utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const roundKey = String(body.round_key ?? "").trim();
    const dniKey = normalizeDniKey(body.dni);
    const slotId = String(body.slot_id ?? "").trim();

    if (!roundKey || !dniKey || !slotId) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const sb = createSupabaseAdmin();
    const configKey = await resolveRoundKey(sb, roundKey);

    const { data: reg } = await sb
      .from("registrations")
      .select("id, full_name, email, phone, kart_number, category_slug")
      .eq("dni_key", dniKey)
      .in("round_key", [roundKey, configKey])
      .maybeSingle();

    if (!reg) {
      return NextResponse.json(
        { error: "Primero debés completar la inscripción." },
        { status: 403 }
      );
    }

    const { data: config } = await sb
      .from("turnos_config")
      .select("ubicacion, instrucciones")
      .eq("round_key", configKey)
      .single();

    const codigo = generateCodigoReserva();

    const { data, error } = await sb.rpc("reservar_turno_iame", {
      p_round_key: configKey,
      p_dni_key: dniKey,
      p_slot_id: slotId,
      p_codigo: codigo,
      p_registration_id: reg.id,
      p_full_name: reg.full_name,
      p_email: reg.email,
      p_phone: reg.phone,
      p_kart_number: reg.kart_number,
      p_category_slug: reg.category_slug,
      p_ubicacion: config?.ubicacion ?? null,
      p_instrucciones: config?.instrucciones ?? null,
    });

    if (error) {
      const msg = error.message;
      if (msg.includes("ALREADY_RESERVED")) {
        return NextResponse.json(
          { error: "Ya tenés un turno reservado para esta fecha." },
          { status: 409 }
        );
      }
      if (msg.includes("SLOT_FULL")) {
        return NextResponse.json(
          { error: "Ese turno ya no tiene cupo. Elegí otro horario." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      codigo,
      ubicacion: config?.ubicacion,
      instrucciones: config?.instrucciones,
      ...data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roundKey = searchParams.get("round_key");
  const dni = searchParams.get("dni");

  if (!roundKey || !dni) {
    return NextResponse.json({ error: "Parámetros faltantes" }, { status: 400 });
  }

  try {
    const sb = createSupabaseAdmin();
    const configKey = await resolveRoundKey(sb, roundKey);
    const { data } = await sb
      .from("reservas_turnos")
      .select("*")
      .in("round_key", [roundKey, configKey])
      .eq("dni_key", normalizeDniKey(dni))
      .maybeSingle();

    return NextResponse.json({ reserva: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
