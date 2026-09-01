import { formatRoundEventDates, getRoundEventWindow } from "./calendar-dates";
import type { Round } from "./types";

export type HomeEventPhase = "upcoming" | "live" | "finished";

export function getRoundStartMs(round: Round): number | null {
  const window = getRoundEventWindow(round);
  if (!window) return null;
  const t = Date.parse(window.start);
  return Number.isNaN(t) ? null : t;
}

export function getRoundEndMs(round: Round): number | null {
  const window = getRoundEventWindow(round);
  if (!window) return null;
  const t = Date.parse(window.end);
  return Number.isNaN(t) ? null : t;
}

export function getHomeEventPhase(
  round: Round,
  now = Date.now(),
): HomeEventPhase {
  const start = getRoundStartMs(round);
  const end = getRoundEndMs(round);

  if (start != null && end != null) {
    if (now >= start && now <= end) return "live";
    if (now > end) return "finished";
    if (round.status === "live") return "live";
    return "upcoming";
  }

  if (round.status === "live") return "live";
  if (round.status === "finished") return "finished";
  return "upcoming";
}

function compareByStart(a: Round, b: Round): number {
  const aStart = getRoundStartMs(a);
  const bStart = getRoundStartMs(b);
  if (aStart == null && bStart == null) return 0;
  if (aStart == null) return 1;
  if (bStart == null) return -1;
  if (aStart !== bStart) return aStart - bStart;
  return a.round_number - b.round_number;
}

export function selectHomeRound(rounds: Round[], now = Date.now()): Round | null {
  if (!rounds.length) return null;

  const stillOpen = rounds.filter((round) => {
    if (round.is_active === false || round.status === "cancelled") return false;
    if (round.status === "finished") return false;
    const end = getRoundEndMs(round);
    if (end == null) return round.status === "upcoming" || round.status === "live";
    return now <= end;
  });

  if (stillOpen.length > 0) {
    return [...stillOpen].sort(compareByStart)[0] ?? null;
  }

  const past = rounds.filter((round) => getHomeEventPhase(round, now) === "finished");
  if (!past.length) return null;

  return (
    [...past].sort((a, b) => {
      const aEnd = getRoundEndMs(a) ?? 0;
      const bEnd = getRoundEndMs(b) ?? 0;
      return bEnd - aEnd;
    })[0] ?? null
  );
}

export function formatHeroCircuit(round: Round): string {
  const raw = (round.circuit ?? round.location ?? "").trim();
  return raw || "Lugar pendiente de confirmación";
}

export function formatHeroHeadline(round: Round): string {
  const name = round.name?.trim();
  if (name) return name;
  return `Fecha ${round.round_number}`;
}

export function isHomeDatePending(
  round: Pick<Round, "round_number" | "event_date">,
): boolean {
  return !round.event_date || round.round_number === 7;
}

export function formatHeroEventDates(
  round: Pick<Round, "round_number" | "event_date">,
): string {
  if (isHomeDatePending(round)) return "A confirmar";
  return formatRoundEventDates(round);
}
