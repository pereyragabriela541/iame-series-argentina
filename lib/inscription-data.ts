import { getRoundDateLabel } from "@/lib/calendar-dates";
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

const INSCRIPTION_CIRCUITS: Record<number, string> = {
  1: "Kartódromo de BS AS",
  2: "Kartódromo Ramiro Tot, Baradero",
  3: "Kartódromo de BS AS",
  4: "Kartódromo Internacional de Zárate",
  5: "Kartódromo de BS AS",
  6: "Kartódromo Ramiro Tot, Baradero",
  7: "Kartódromo de BS AS",
  8: "Kartódromo a confirmar",
  9: "Kartódromo de BS AS",
  10: "Kartódromo de BS AS",
  11: "Kartódromo a confirmar",
};

function buildInscriptionLabel(roundNumber: number, suffix = ""): string {
  const name =
    roundNumber === 11 ? "Final IAME Argentina" : `Fecha ${roundNumber}`;
  const dates = getRoundDateLabel(roundNumber);
  const circuit = INSCRIPTION_CIRCUITS[roundNumber];
  return `${name} — ${dates} — ${circuit}${suffix}`;
}

/** Calendario oficial 2026 — IAME Series Argentina */
export const INSCRIPTION_ROUNDS: InscriptionRoundOption[] = [
  { value: "fecha-1", label: buildInscriptionLabel(1) },
  { value: "fecha-2", label: buildInscriptionLabel(2) },
  { value: "fecha-3", label: buildInscriptionLabel(3) },
  { value: "fecha-4", label: buildInscriptionLabel(4) },
  { value: "fecha-5", label: buildInscriptionLabel(5) },
  { value: "fecha-6", label: buildInscriptionLabel(6, " (2 pilotos)") },
  { value: "fecha-7", label: buildInscriptionLabel(7) },
  { value: "fecha-8", label: buildInscriptionLabel(8) },
  { value: "fecha-9", label: buildInscriptionLabel(9) },
  { value: "fecha-10", label: buildInscriptionLabel(10) },
  { value: "final-iame", label: buildInscriptionLabel(11) },
];

const FINISHED_ROUND_KEYS = new Set([
  "fecha-1",
  "fecha-2",
  "fecha-3",
  "fecha-4",
]);

/** Fechas abiertas a inscripción (sin las ya finalizadas) */
export const INSCRIPTION_ROUNDS_OPEN = INSCRIPTION_ROUNDS.filter(
  (r) => !FINISHED_ROUND_KEYS.has(r.value)
);

/** Categorías oficiales 2026 */
export const INSCRIPTION_CATEGORIES: InscriptionCategoryOption[] = [
  { value: "60-mini", label: "60 MINI" },
  { value: "60-mini-under", label: "60 MINI UNDER" },
  { value: "junior", label: "JUNIOR MY10" },
  { value: "senior", label: "SENIOR MY10" },
  { value: "master", label: "MASTER MY10/GENTLEMAN" },
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
  const dates = getRoundDateLabel(r.round_number);
  const suffix =
    r.round_number === 6 ? " (2 pilotos)" : "";
  if (r.circuit) {
    return `${r.name} — ${dates} — ${r.circuit}${suffix}`;
  }
  return `${r.name} — ${dates}${suffix}`;
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
