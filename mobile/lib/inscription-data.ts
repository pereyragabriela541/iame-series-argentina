import type { Category, Round } from "./types";

export interface InscriptionRoundOption {
  value: string;
  label: string;
  roundId?: string;
}

export interface InscriptionCategoryOption {
  value: string;
  label: string;
}

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

export function roundsToOptions(rounds: Round[]): InscriptionRoundOption[] {
  const openRounds = rounds.filter(
    (r) => r.status === "upcoming" || r.status === "live",
  );
  if (!openRounds.length) return [];
  return openRounds.map((r) => ({
    value: roundNumberToKey(r.round_number),
    label: `${r.name}${r.circuit ? ` — ${r.circuit}` : ""}`,
    roundId: r.id,
  }));
}

export function categoriesToOptions(
  categories: Category[],
): InscriptionCategoryOption[] {
  if (!categories.length) return INSCRIPTION_CATEGORIES;
  return categories.map((c) => ({
    value: c.slug,
    label: c.name.toUpperCase(),
  }));
}

export function findRoundLabel(
  value: string,
  options: InscriptionRoundOption[],
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}
