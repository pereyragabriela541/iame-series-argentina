import { isUuid } from "@/lib/inscription-data";
import type { SupabaseClient } from "@supabase/supabase-js";

export function roundNumberToKey(roundNumber: number): string {
  if (roundNumber === 11) return "final-iame";
  return `fecha-${roundNumber}`;
}

/** Convierte UUID de `rounds` o slug `fecha-N` al round_key de turnos. */
export async function resolveRoundKey(
  sb: SupabaseClient,
  roundKey: string
): Promise<string> {
  const trimmed = String(roundKey ?? "").trim();
  if (!trimmed || !isUuid(trimmed)) return trimmed;

  const { data } = await sb
    .from("rounds")
    .select("round_number")
    .eq("id", trimmed)
    .maybeSingle();

  if (!data) return trimmed;
  return roundNumberToKey(data.round_number);
}
