import { formatRoundEventDates } from "@/lib/calendar-dates";
import type { Category, Round } from "@/lib/types";

export interface InscriptionRoundOption {
  value: string;
  label: string;
  roundId?: string;
}

export interface InscriptionCategoryOption {
  value: string;
  label: string;
}

/**
 * Fallback solo si Supabase no responde.
 * Las fechas/circuitos reales vienen de `rounds` vía `roundsToOptions`.
 */
export const INSCRIPTION_ROUNDS: InscriptionRoundOption[] = [
  { value: "fecha-1", label: "Fecha 1" },
  { value: "fecha-2", label: "Fecha 2" },
  { value: "fecha-3", label: "Fecha 3" },
  { value: "fecha-4", label: "Fecha 4" },
  { value: "fecha-5", label: "Fecha 5" },
  { value: "fecha-6", label: "Fecha 6" },
  { value: "fecha-7", label: "Fecha 7" },
  { value: "fecha-8", label: "Fecha 8" },
  { value: "fecha-9", label: "Fecha 9" },
  { value: "fecha-10", label: "Fecha 10" },
  { value: "final-iame", label: "Final IAME Argentina" },
];

/** Fallback vacío: sin rounds de DB no se listan fechas (evita calendario viejo). */
export const INSCRIPTION_ROUNDS_OPEN: InscriptionRoundOption[] = [];

/** Fallback de categorías si Supabase no responde. */
export const INSCRIPTION_CATEGORIES: InscriptionCategoryOption[] = [
  { value: "60-mini", label: "60 MINI" },
  { value: "60-mini-under", label: "60 MINI UNDER" },
  { value: "junior", label: "JUNIOR MY10" },
  { value: "senior", label: "SENIOR MY10" },
  { value: "master", label: "MASTER MY10" },
  { value: "master-gentleman", label: "GENTLEMAN" },
  { value: "okn-junior", label: "OKN JUNIOR" },
  { value: "okn", label: "OKN" },
  { value: "senior-pro-390-honda", label: "SENIOR 390 PRO/HONDA" },
  { value: "academy", label: "ACADEMY/HONDA" },
];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function roundNumberToKey(roundNumber: number): string {
  if (roundNumber === 11) return "final-iame";
  return `fecha-${roundNumber}`;
}

function roundToInscriptionLabel(r: Round): string {
  const dates = formatRoundEventDates(r);
  const parts = [r.name];
  if (dates && dates !== "—") parts.push(dates);
  if (r.circuit) parts.push(r.circuit);
  return parts.join(" — ");
}

export function roundsToOptions(rounds: Round[]): InscriptionRoundOption[] {
  const openRounds = rounds.filter(
    (r) => r.status === "upcoming" || r.status === "live"
  );

  if (!openRounds.length) {
    return INSCRIPTION_ROUNDS_OPEN;
  }

  return openRounds.map((r) => ({
    value: roundNumberToKey(r.round_number),
    label: roundToInscriptionLabel(r),
    roundId: r.id,
  }));
}

export function categoriesToOptions(
  categories: Category[]
): InscriptionCategoryOption[] {
  if (!categories.length) return INSCRIPTION_CATEGORIES;
  return categories.map((c) => ({
    value: c.slug,
    label: c.name.toUpperCase(),
  }));
}

export function findRoundLabel(
  value: string,
  options: InscriptionRoundOption[]
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

/** Fecha 6: inscripción titular + piloto invitado (solo esa fecha). */
export function isDualPilotRound(roundKey: string): boolean {
  return roundKey === "fecha-6";
}

