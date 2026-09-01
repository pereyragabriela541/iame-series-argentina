import { formatRoundEventDates } from "@/lib/calendar-dates";
import { isDualPilotRound, roundToKey } from "@/lib/round-keys";
import type { Category, Round } from "@/lib/types";

export interface InscriptionRoundOption {
  value: string;
  label: string;
  roundId?: string;
  dualPilot?: boolean;
}

export interface InscriptionCategoryOption {
  value: string;
  label: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function roundNumberToKey(roundNumber: number): string {
  return `fecha-${roundNumber}`;
}

function isInscriptionDatePending(r: Pick<Round, "round_number" | "event_date">): boolean {
  return !r.event_date || r.round_number === 7 || r.round_number === 11;
}

function roundToInscriptionLabel(r: Round): string {
  if (isInscriptionDatePending(r)) {
    return `${r.name} — A confirmar`;
  }
  const dates = formatRoundEventDates(r);
  const parts = [r.name];
  if (dates) parts.push(dates);
  if (r.circuit) parts.push(r.circuit);
  return parts.join(" — ");
}

export function roundsToOptions(rounds: Round[]): InscriptionRoundOption[] {
  const openRounds = rounds.filter(
    (r) => r.status === "upcoming" || r.status === "live"
  );

  return openRounds.map((r) => ({
    value: roundToKey(r),
    label: roundToInscriptionLabel(r),
    roundId: r.id,
    dualPilot: isDualPilotRound(r),
  }));
}

export function categoriesToOptions(
  categories: Category[]
): InscriptionCategoryOption[] {
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

export { isDualPilotRound };
