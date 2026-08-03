/** Fechas de carrera desde Supabase (`rounds.event_date` / `event_date_iso`). */

export function getRoundBadge(roundNumber: number): {
  caption: string;
  label: string;
} {
  if (roundNumber === 11) {
    return { caption: "", label: "Final" };
  }
  return { caption: "Fecha", label: String(roundNumber) };
}

export function getRoundKicker(roundNumber: number): string {
  return roundNumber === 11 ? "Final" : `Fecha ${roundNumber}`;
}

/** Etiqueta de fin de semana (sábado + domingo) a partir de `event_date` (día de inicio). */
export function formatRoundEventDates(round: {
  event_date?: string | null;
}): string {
  if (!round.event_date) return "—";

  const start = new Date(round.event_date + "T12:00:00");
  if (Number.isNaN(start.getTime())) return round.event_date;

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const fmtDayMonth = (d: Date) =>
    d.toLocaleDateString("es-AR", { day: "numeric", month: "long" });

  if (start.getMonth() === end.getMonth()) {
    const month = start.toLocaleDateString("es-AR", { month: "long" });
    return `${start.getDate()} y ${end.getDate()} de ${month}`;
  }

  return `${fmtDayMonth(start)} y ${fmtDayMonth(end)}`;
}

const RACE_START_HOUR = 8;
const RACE_END_HOUR = 20;
const ARG_TZ_OFFSET = "-03:00";

function toRaceInstant(date: string, hour: number): string {
  return `${date}T${String(hour).padStart(2, "0")}:00:00${ARG_TZ_OFFSET}`;
}

/** Ventana de carrera para cuenta regresiva (inicio sábado 08:00 ART, fin domingo 20:00 ART). */
export function getRoundEventWindow(round: {
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

  if (!round.event_date) return null;

  const endDate = new Date(round.event_date + "T12:00:00");
  endDate.setDate(endDate.getDate() + 1);
  const endIso = endDate.toISOString().slice(0, 10);

  return {
    start: toRaceInstant(round.event_date, RACE_START_HOUR),
    end: toRaceInstant(endIso, RACE_END_HOUR),
  };
}
