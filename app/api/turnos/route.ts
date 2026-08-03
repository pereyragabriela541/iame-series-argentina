import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { resolveRoundKey } from "@/lib/round-keys";
import {
  buildSlotsFromConfig,
  countReservationsBySlot,
  groupSlotsByFecha,
  mergeSlotAvailability,
  type TurnosConfig,
} from "@/lib/turnos-utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roundKey = searchParams.get("round_key");

  if (!roundKey) {
    return NextResponse.json({ error: "round_key requerido" }, { status: 400 });
  }

  try {
    const sb = createSupabaseAdmin();
    const configKey = await resolveRoundKey(sb, roundKey);

    const { data: config, error: cfgErr } = await sb
      .from("turnos_config")
      .select("*")
      .eq("round_key", configKey)
      .eq("activo", true)
      .maybeSingle();

    if (cfgErr) {
      return NextResponse.json({ error: cfgErr.message }, { status: 500 });
    }

    if (!config) {
      return NextResponse.json({
        activo: false,
        config: null,
        slots: [],
        byFecha: {},
      });
    }

    const typedConfig: TurnosConfig = {
      ...config,
      dias: (config.dias as string[]) ?? [],
    };

    const theoretical = buildSlotsFromConfig(typedConfig);

    const [{ data: occupied }, { data: reservations }] = await Promise.all([
      sb
        .from("turnos_slots")
        .select("slot_id, reservados, cupo_max")
        .eq("round_key", configKey),
      sb.from("reservas_turnos").select("slot_id").eq("round_key", configKey),
    ]);

    const reservationCounts = countReservationsBySlot(reservations ?? []);
    const slots = mergeSlotAvailability(
      theoretical,
      occupied ?? [],
      reservationCounts
    );
    const byFecha = groupSlotsByFecha(slots);

    return NextResponse.json({
      activo: true,
      config: typedConfig,
      slots,
      byFecha,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
