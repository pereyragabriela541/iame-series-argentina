import { createSupabaseAdmin } from "@/lib/supabase/admin";

export function verifyAdminExportToken(request: Request): boolean {
  const expected = process.env.ADMIN_EXPORT_TOKEN?.trim();
  if (!expected) return false;

  const url = new URL(request.url);
  const token =
    url.searchParams.get("token")?.trim() ??
    request.headers.get("x-admin-token")?.trim();

  return token === expected;
}

export function unauthorizedResponse() {
  return new Response("No autorizado", { status: 401 });
}

export async function listExportRoundKeys(): Promise<string[]> {
  const sb = createSupabaseAdmin();

  const [{ data: regs }, { data: configs }] = await Promise.all([
    sb.from("registrations").select("round_key").not("round_key", "is", null),
    sb.from("turnos_config").select("round_key, evento_nombre"),
  ]);

  const labels = new Map<string, string>();
  for (const c of configs ?? []) {
    if (c.round_key) labels.set(c.round_key, c.evento_nombre ?? c.round_key);
  }

  const keys = new Set<string>();
  for (const r of regs ?? []) {
    if (r.round_key) keys.add(r.round_key);
  }
  for (const c of configs ?? []) {
    if (c.round_key) keys.add(c.round_key);
  }

  return [...keys].sort((a, b) => {
    const la = labels.get(a) ?? a;
    const lb = labels.get(b) ?? b;
    return la.localeCompare(lb, "es");
  });
}

export async function fetchInscriptos(roundKey: string) {
  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("registrations")
    .select(
      "round_key, full_name, dni, email, phone, birth_date, category_slug, kart_number, team, city, origen, created_at, extra",
    )
    .eq("round_key", roundKey)
    .order("full_name", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const extra = (row.extra ?? {}) as Record<string, string>;
    return {
      fecha: extra.round_label ?? row.round_key ?? "",
      round_key: row.round_key ?? "",
      nombre: row.full_name ?? "",
      dni: row.dni ?? "",
      email: row.email ?? "",
      telefono: row.phone ?? "",
      nacimiento: row.birth_date ?? "",
      categoria: extra.category_label ?? row.category_slug ?? "",
      kart: row.kart_number ?? "",
      equipo: row.team ?? "",
      ciudad: row.city ?? "",
      origen: row.origen ?? "",
      inscripto_el: row.created_at ?? "",
    };
  });
}

export async function fetchTurnos(roundKey: string) {
  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("reservas_turnos")
    .select(
      "codigo, fecha, hora, hora_fin, full_name, dni_key, email, phone, kart_number, category_slug, ubicacion, round_key, created_at",
    )
    .eq("round_key", roundKey)
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    codigo: row.codigo ?? "",
    fecha: row.fecha ?? "",
    hora: row.hora ?? "",
    hora_fin: row.hora_fin ?? "",
    nombre: row.full_name ?? "",
    dni: row.dni_key ?? "",
    email: row.email ?? "",
    telefono: row.phone ?? "",
    kart: row.kart_number ?? "",
    categoria: row.category_slug ?? "",
    ubicacion: row.ubicacion ?? "",
    round_key: row.round_key ?? "",
    reservado_el: row.created_at ?? "",
  }));
}

export function csvDownloadResponse(filename: string, csv: string) {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
