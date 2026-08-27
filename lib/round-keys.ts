import type { SupabaseClient } from "@supabase/supabase-js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function roundToKey(round: {
  round_key?: string | null;
  round_number: number;
}): string {
  const key = String(round.round_key ?? "").trim();
  if (key) return key;
  return `fecha-${round.round_number}`;
}

export function roundNumberToKey(roundNumber: number): string {
  return `fecha-${roundNumber}`;
}

export type RoundFlags = {
  id: string;
  round_key: string;
  name: string;
  dual_pilot: boolean;
  email_note: string | null;
};

/** Convierte UUID de `rounds` o slug `fecha-N` al round_key de turnos. */
export async function resolveRoundKey(
  sb: SupabaseClient,
  roundKey: string
): Promise<string> {
  const trimmed = String(roundKey ?? "").trim();
  if (!trimmed || !isUuid(trimmed)) return trimmed;

  const { data } = await sb
    .from("rounds")
    .select("round_key, round_number")
    .eq("id", trimmed)
    .maybeSingle();

  if (!data) return trimmed;
  return roundToKey(data);
}

export async function fetchRoundFlags(
  sb: SupabaseClient,
  roundKey: string,
): Promise<RoundFlags | null> {
  const key = await resolveRoundKey(sb, roundKey);
  const { data: season } = await sb
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .maybeSingle();

  const select =
    "id, round_key, round_number, name, dual_pilot, email_note";

  let query = sb.from("rounds").select(select).eq("round_key", key);
  if (season?.id) query = query.eq("season_id", season.id);
  const { data } = await query.maybeSingle();
  if (data) {
    return {
      id: data.id,
      round_key: roundToKey(data),
      name: data.name,
      dual_pilot: Boolean(data.dual_pilot),
      email_note: data.email_note ?? null,
    };
  }

  const fecha = /^fecha-(\d+)$/.exec(key);
  if (!fecha) return null;
  let byNumber = sb
    .from("rounds")
    .select(select)
    .eq("round_number", Number(fecha[1]));
  if (season?.id) byNumber = byNumber.eq("season_id", season.id);
  const { data: row } = await byNumber.maybeSingle();
  if (!row) return null;
  return {
    id: row.id,
    round_key: roundToKey(row),
    name: row.name,
    dual_pilot: Boolean(row.dual_pilot),
    email_note: row.email_note ?? null,
  };
}

export function isDualPilotRound(round: {
  dualPilot?: boolean;
  dual_pilot?: boolean | null;
} | null | undefined): boolean {
  return Boolean(round?.dualPilot ?? round?.dual_pilot);
}

export function listNewsInFeed<T extends { list_in_feed?: boolean }>(
  news: T[],
): T[] {
  return news.filter((n) => n.list_in_feed !== false);
}
