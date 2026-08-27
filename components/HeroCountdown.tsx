"use client";

import { useEffect, useState } from "react";
import { getRoundEventWindow } from "@/lib/calendar-dates";
import type { HomeEventPhase } from "@/lib/next-round";
import type { Round } from "@/lib/types";

type Units = { days: number; hours: number; minutes: number };

function diffUnits(startIso: string, now: number): Units | null {
  const start = new Date(startIso).getTime();
  if (Number.isNaN(start)) return null;
  const diff = start - now;
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
  };
}

export default function HeroCountdown({
  round,
  phase,
  hasResults,
}: {
  round: Pick<Round, "event_date" | "event_date_iso" | "event_end_iso" | "status">;
  phase: HomeEventPhase;
  hasResults: boolean;
}) {
  const eventWindow = getRoundEventWindow(round);
  const eventStart = eventWindow?.start;
  const [units, setUnits] = useState<Units | null>(null);

  useEffect(() => {
    if (!eventStart || phase !== "upcoming") return;
    const tick = () => setUnits(diffUnits(eventStart, Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [eventStart, phase]);

  if (phase === "live") {
    return (
      <div
        className="flex items-center justify-center gap-3 rounded-lg border border-[#E30613] bg-[#070E1A]/70 px-4 py-3"
        aria-live="polite"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-[#E30613]" />
        <p className="text-lg font-black italic uppercase tracking-[0.2em] text-white [text-shadow:-1px_0_#000,1px_0_#000,0_1px_#000,0_-1px_#000]">
          En vivo
        </p>
      </div>
    );
  }

  if (phase === "finished") {
    return (
      <div className="rounded-lg border border-white/20 bg-[#070E1A]/70 px-4 py-3">
        <p className="text-sm font-black italic uppercase tracking-widest text-white [text-shadow:-1px_0_#000,1px_0_#000,0_1px_#000,0_-1px_#000]">
          Evento finalizado
        </p>
        {hasResults ? (
          <a
            href="/resultados"
            className="mt-2 inline-block text-xs font-bold uppercase tracking-widest text-[#E30613] hover:underline"
          >
            Ver resultados
          </a>
        ) : null}
      </div>
    );
  }

  if (!eventWindow) {
    return (
      <div className="rounded-lg border border-white/20 bg-[#070E1A]/70 px-4 py-3 text-sm text-neutral-300">
        Fecha a confirmar
      </div>
    );
  }

  const label = units
    ? `Faltan ${units.days} días, ${units.hours} horas y ${units.minutes} minutos`
    : "Calculando cuenta regresiva";

  return (
    <div
      className="flex flex-col gap-3 rounded-md border border-[#75BEE9]/80 bg-[#070E1A]/85 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:px-4"
      aria-label={label}
    >
      <div className="min-w-[4.5rem]">
        <p className="text-sm font-black italic uppercase tracking-widest text-white [text-shadow:-1px_0_#000,1px_0_#000,0_1px_#000,0_-1px_#000]">
          Faltan
        </p>
        <p className="font-black tracking-widest text-[#E30613]" aria-hidden>
          {">>>"}
        </p>
      </div>
      {units ? (
        <div className="grid min-w-0 flex-1 grid-cols-3 divide-x divide-white/20">
          <CountUnit value={units.days} label="Días" />
          <CountUnit value={units.hours} label="Horas" />
          <CountUnit value={units.minutes} label="Min" />
        </div>
      ) : (
        <div className="h-8 flex-1 animate-pulse rounded bg-white/10" />
      )}
    </div>
  );
}

function CountUnit({ value, label }: { value: number; label: string }) {
  const safe = Number.isFinite(value) && value >= 0 ? value : 0;
  return (
    <div className="min-w-0 px-1 text-center sm:px-3">
      <p className="text-[clamp(1.25rem,4vw,1.875rem)] font-black tabular-nums text-white [text-shadow:-1px_0_#000,1px_0_#000,0_1px_#000,0_-1px_#000]">
        {String(safe)}
      </p>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A7A9AC]">
        {label}
      </p>
    </div>
  );
}
