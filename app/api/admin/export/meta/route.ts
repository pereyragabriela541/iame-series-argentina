import { NextResponse } from "next/server";

import {
  listExportRoundKeys,
  unauthorizedResponse,
  verifyAdminExportToken,
} from "@/lib/admin-export";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!verifyAdminExportToken(request)) return unauthorizedResponse();

  try {
    const roundKeys = await listExportRoundKeys();
    const sb = createSupabaseAdmin();
    const { data: configs } = await sb
      .from("turnos_config")
      .select("round_key, evento_nombre");

    const labels: Record<string, string> = {};
    for (const c of configs ?? []) {
      if (c.round_key) labels[c.round_key] = c.evento_nombre ?? c.round_key;
    }

    return NextResponse.json({
      rounds: roundKeys.map((key) => ({
        key,
        label: labels[key] ?? key,
      })),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al cargar fechas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
