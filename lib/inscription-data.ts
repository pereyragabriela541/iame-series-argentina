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

/** Calendario oficial 2026 — IAME Series Argentina */
export const INSCRIPTION_ROUNDS: InscriptionRoundOption[] = [
  {
    value: "fecha-1",
    label: "Fecha 1 — 28 de Febrero / 1 de Marzo — Kartódromo de BS AS",
  },
  {
    value: "fecha-2",
    label: "Fecha 2 — 28 y 29 de Marzo — Kartódromo Ramiro Tot, Baradero",
  },
  {
    value: "fecha-3",
    label: "Fecha 3 — 25 y 26 de Abril — Kartódromo de BS AS",
  },
  {
    value: "fecha-4",
    label: "Fecha 4 — 30 y 31 de Mayo — Kartódromo Internacional de Zárate",
  },
  {
    value: "fecha-5",
    label: "Fecha 5 — 18 y 19 de Julio — Kartódromo de BS AS",
  },
  {
    value: "fecha-6",
    label: "Fecha 6 — 8 y 9 de Agosto — Kartódromo Ramiro Tot, Baradero (2 pilotos)",
  },
  {
    value: "fecha-7",
    label: "Fecha 7 — 3 y 4 de Octubre — Kartódromo de BS AS",
  },
  {
    value: "fecha-8",
    label: "Fecha 8 — 31 de Octubre / 1 de Noviembre — Kartódromo a confirmar",
  },
  {
    value: "fecha-9",
    label: "Fecha 9 — 14 y 15 de Noviembre — Kartódromo de BS AS",
  },
  {
    value: "fecha-10",
    label: "Fecha 10 — 19 y 20 de Diciembre — Kartódromo de BS AS",
  },
  {
    value: "final-iame",
    label: "Final IAME Argentina — 5 y 6 de Septiembre — Kartódromo a confirmar",
  },
];

/** Categorías oficiales 2026 */
export const INSCRIPTION_CATEGORIES: InscriptionCategoryOption[] = [
  { value: "60-mini", label: "60 MINI" },
  { value: "60-mini-under", label: "60 MINI UNDER" },
  { value: "junior", label: "JUNIOR MY10" },
  { value: "senior", label: "SENIOR MY10" },
  { value: "master-my10", label: "MASTER MY10" },
  { value: "okn-junior", label: "OKN JUNIOR" },
  { value: "okn", label: "OKN" },
  { value: "master-gentleman", label: "MASTER MY10 GENTLEMAN" },
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

export function roundsToOptions(rounds: Round[]): InscriptionRoundOption[] {
  if (!rounds.length) return INSCRIPTION_ROUNDS;
  return rounds.map((r) => ({
    value: roundNumberToKey(r.round_number),
    label: r.circuit
      ? `${r.name} — ${r.circuit}`
      : r.name,
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
