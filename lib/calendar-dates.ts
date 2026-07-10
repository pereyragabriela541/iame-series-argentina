/** Calendario oficial 2026 — cada fecha son dos días de carrera */
export const ROUND_DATE_RANGES: Record<
  number,
  { label: string; start: string; end: string }
> = {
  1: { label: "28 de Febrero y 1 de Marzo", start: "2026-02-28", end: "2026-03-01" },
  2: { label: "28 y 29 de Marzo", start: "2026-03-28", end: "2026-03-29" },
  3: { label: "25 y 26 de Abril", start: "2026-04-25", end: "2026-04-26" },
  4: { label: "30 y 31 de Mayo", start: "2026-05-30", end: "2026-05-31" },
  5: { label: "18 y 19 de Julio", start: "2026-07-18", end: "2026-07-19" },
  6: { label: "8 y 9 de Agosto", start: "2026-08-08", end: "2026-08-09" },
  7: { label: "3 y 4 de Octubre", start: "2026-10-03", end: "2026-10-04" },
  8: { label: "31 de Octubre y 1 de Noviembre", start: "2026-10-31", end: "2026-11-01" },
  9: { label: "14 y 15 de Noviembre", start: "2026-11-14", end: "2026-11-15" },
  10: { label: "19 y 20 de Diciembre", start: "2026-12-19", end: "2026-12-20" },
  11: { label: "5 y 6 de Septiembre", start: "2026-09-05", end: "2026-09-06" },
};

export function getRoundDateLabel(roundNumber: number): string {
  return ROUND_DATE_RANGES[roundNumber]?.label ?? "";
}

/** Etiqueta lateral en tarjetas del calendario */
export function getRoundBadge(roundNumber: number): {
  caption: string;
  label: string;
} {
  if (roundNumber === 11) {
    return { caption: "", label: "Final" };
  }
  return { caption: "Fecha", label: String(roundNumber) };
}

/** Kicker en detalle de fecha */
export function getRoundKicker(roundNumber: number): string {
  return roundNumber === 11 ? "Final" : `Fecha ${roundNumber}`;
}

export function formatRoundEventDates(round: {
  round_number: number;
  event_date?: string | null;
}): string {
  const official = ROUND_DATE_RANGES[round.round_number];
  if (official) return official.label;

  if (!round.event_date) return "—";

  const start = new Date(round.event_date + "T12:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const fmt = (d: Date) =>
    d.toLocaleDateString("es-AR", { day: "numeric", month: "long" });

  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} y ${end.getDate()} de ${fmt(start).split(" ").slice(1).join(" ")}`;
  }

  return `${fmt(start)} y ${fmt(end)}`;
}

const RACE_START_HOUR = 8;
const RACE_END_HOUR = 20;
const ARG_TZ_OFFSET = "-03:00";

function toRaceInstant(date: string, hour: number): string {
  return `${date}T${String(hour).padStart(2, "0")}:00:00${ARG_TZ_OFFSET}`;
}

/** Ventana de carrera para cuenta regresiva (inicio sábado 08:00 ART, fin domingo 20:00 ART). */
export function getRoundEventWindow(round: {
  round_number: number;
  event_date?: string | null;
  event_date_iso?: string | null;
}): { start: string; end: string } | null {
  if (round.event_date_iso) {
    const startDate = round.event_date_iso.slice(0, 10);
    const endDate = new Date(startDate + "T12:00:00");
    endDate.setDate(endDate.getDate() + 1);
    const endIso = endDate.toISOString().slice(0, 10);
    return {
      start: round.event_date_iso,
      end: toRaceInstant(endIso, RACE_END_HOUR),
    };
  }

  const official = ROUND_DATE_RANGES[round.round_number];
  if (official) {
    return {
      start: toRaceInstant(official.start, RACE_START_HOUR),
      end: toRaceInstant(official.end, RACE_END_HOUR),
    };
  }

  if (!round.event_date) return null;

  const endDate = new Date(round.event_date + "T12:00:00");
  endDate.setDate(endDate.getDate() + 1);
  const endIso = endDate.toISOString().slice(0, 10);

  return {
    start: toRaceInstant(round.event_date, RACE_START_HOUR),
    end: toRaceInstant(endIso, RACE_END_HOUR),
  };
}
