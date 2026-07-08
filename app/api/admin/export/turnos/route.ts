import { NextResponse } from "next/server";

import {
  csvDownloadResponse,
  fetchTurnos,
  unauthorizedResponse,
  verifyAdminExportToken,
} from "@/lib/admin-export";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HEADERS = [
  "codigo",
  "fecha",
  "hora",
  "hora_fin",
  "nombre",
  "dni",
  "email",
  "telefono",
  "kart",
  "categoria",
  "ubicacion",
  "round_key",
  "reservado_el",
];

export async function GET(request: Request) {
  if (!verifyAdminExportToken(request)) return unauthorizedResponse();

  const roundKey = new URL(request.url).searchParams.get("round_key")?.trim();
  if (!roundKey) {
    return NextResponse.json({ error: "Falta round_key" }, { status: 400 });
  }

  try {
    const rows = await fetchTurnos(roundKey);
    const csv = toCsv(HEADERS, rows);
    return csvDownloadResponse(`turnos-${roundKey}.csv`, csv);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al exportar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
