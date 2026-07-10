"use client";

import { useEffect, useMemo, useState } from "react";
import { getRoundEventWindow } from "@/lib/calendar-dates";
import type { Round } from "@/lib/types";

interface RoundCountdownProps {
  round: Pick<Round, "round_number" | "event_date" | "event_date_iso" | "status">;
}

type CountdownState =
  | { kind: "loading" }
  | { kind: "live" }
  | { kind: "racing" }
  | { kind: "countdown"; totalSeconds: number; days: number; hours: number; minutes: number; seconds: number };

/** Secuencia automática: 1→5 luces, pausa, todas apagadas, repetir. */
function useF1LightSequence(enabled: boolean): number {
  const [activeColumns, setActiveColumns] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setActiveColumns(0);
      return;
    }

    let step = 0;
    const id = setInterval(() => {
      step = step >= 11 ? 1 : step + 1;
      if (step <= 5) setActiveColumns(step);
      else if (step === 7) setActiveColumns(0);
    }, 1000);

    return () => clearInterval(id);
  }, [enabled]);

  return activeColumns;
}

function getCountdownState(
  window: { start: string; end: string },
  status: Round["status"],
  now: number,
): CountdownState {
  if (status === "live") return { kind: "live" };

  const start = new Date(window.start).getTime();
  const end = new Date(window.end).getTime();

  if (now >= start && now <= end) return { kind: "racing" };

  const diff = start - now;
  if (diff <= 0) return { kind: "racing" };

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { kind: "countdown", totalSeconds, days, hours, minutes, seconds };
}

function LightBulb({ on }: { on: boolean }) {
  return (
    <div
      className={`relative h-4 w-4 rounded-full border transition-all duration-200 sm:h-[18px] sm:w-[18px] ${
        on
          ? "border-red-500 bg-iame-red shadow-[0_0_10px_rgba(227,6,19,0.9),inset_0_0_4px_rgba(255,80,80,0.5)]"
          : "border-neutral-800 bg-neutral-950"
      }`}
    >
      <div
        className={`absolute inset-[2px] rounded-full bg-[repeating-linear-gradient(45deg,transparent,transparent_1px,rgba(0,0,0,0.35)_1px,rgba(0,0,0,0.35)_2px)] ${
          on ? "opacity-30" : "opacity-60"
        }`}
      />
    </div>
  );
}

function F1StartGantry({ activeColumns }: { activeColumns: number }) {
  return (
    <div className="w-full">
      <div className="flex justify-center gap-0.5 border border-neutral-800 bg-neutral-950 px-1 py-1.5 sm:gap-1 sm:px-1.5">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="flex flex-col gap-0.5 rounded-sm border border-neutral-800 bg-neutral-900 px-0.5 py-1 sm:gap-1 sm:px-1 sm:py-1.5"
          >
            <LightBulb on={i < activeColumns} />
            <LightBulb on={i < activeColumns} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex h-11 w-11 items-center justify-center border border-neutral-800 bg-black font-mono text-base font-bold tabular-nums text-iame-red sm:h-12 sm:w-12 sm:text-xl">
        {String(value).padStart(2, "0")}
      </div>
      <span className="text-[8px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
        {label}
      </span>
    </div>
  );
}

export default function RoundCountdown({ round }: RoundCountdownProps) {
  const window = useMemo(
    () => getRoundEventWindow(round),
    [round.round_number, round.event_date, round.event_date_iso],
  );
  const [state, setState] = useState<CountdownState>({ kind: "loading" });
  const showLights = state.kind === "countdown";
  const activeColumns = useF1LightSequence(showLights);

  useEffect(() => {
    if (!window) return;

    const tick = () => {
      setState(getCountdownState(window, round.status, Date.now()));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [window, round.status]);

  if (!window) return null;

  if (state.kind === "loading") {
    return (
      <div className="mb-4 h-32 animate-pulse border border-neutral-800 bg-neutral-900/40" />
    );
  }

  if (state.kind === "live" || state.kind === "racing") {
    return (
      <div className="mb-4 flex items-center gap-3 border border-iame-red/40 bg-iame-red/10 px-4 py-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping bg-iame-red opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 bg-iame-red" />
        </span>
        <p className="text-xs font-bold uppercase tracking-widest text-iame-red">
          {state.kind === "live" ? "En vivo ahora" : "Fin de semana de carrera"}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4 border border-neutral-800 bg-neutral-900/40 px-4 py-4">
      <div className="mx-auto flex w-fit flex-col gap-3">
        <F1StartGantry activeColumns={activeColumns} />

        <div className="flex justify-center gap-1.5 sm:gap-2">
        <CountdownUnit value={state.days} label="Días" />
        <span className="self-start pt-2.5 font-mono text-base font-bold text-iame-red sm:pt-3 sm:text-lg">
          :
        </span>
        <CountdownUnit value={state.hours} label="Hs" />
        <span className="self-start pt-2.5 font-mono text-base font-bold text-iame-red sm:pt-3 sm:text-lg">
          :
        </span>
        <CountdownUnit value={state.minutes} label="Min" />
        <span className="self-start pt-2.5 font-mono text-base font-bold text-iame-red sm:pt-3 sm:text-lg">
          :
        </span>
        <CountdownUnit value={state.seconds} label="Seg" />
        </div>
      </div>
    </div>
  );
}
