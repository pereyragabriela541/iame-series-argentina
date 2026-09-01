"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import HeroCountdown from "@/components/HeroCountdown";
import {
  formatHeroCircuit,
  formatHeroEventDates,
  formatHeroHeadline,
  getHomeEventPhase,
  isHomeDatePending,
} from "@/lib/next-round";
import type { Round } from "@/lib/types";

// Respaldo técnico solamente: la portada normal viene de media_images en Supabase.
const FALLBACK = "/assets/hero-karting.jpg";

interface HomeHeroProps {
  round: Round | null;
  imageUrl: string | null;
  inscriptionOpen: boolean;
  hasResults: boolean;
  error?: string | null;
}

export default function HomeHero({
  round,
  imageUrl,
  inscriptionOpen,
  hasResults,
  error = null,
}: HomeHeroProps) {
  const [now, setNow] = useState(() => Date.now());
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setImgFailed(false);
  }, [imageUrl]);

  const phase = useMemo(
    () => (round ? getHomeEventPhase(round, now) : "upcoming"),
    [round, now],
  );

  const photo = !imageUrl || imgFailed ? FALLBACK : imageUrl;
  const closed = !inscriptionOpen || phase === "finished";
  const dateLabel = round ? formatHeroEventDates(round) : "";
  const circuitLabel = round ? formatHeroCircuit(round) : "";
  const showCircuit =
    Boolean(circuitLabel) &&
    circuitLabel.toLowerCase() !== dateLabel.toLowerCase();
  const countdownRound =
    round && isHomeDatePending(round)
      ? { ...round, event_date: null, event_date_iso: null, event_end_iso: null }
      : round;

  return (
    <section className="relative left-1/2 min-h-[calc(100svh-4.5rem)] w-screen max-w-[100vw] -translate-x-1/2 -mt-8 overflow-hidden bg-[#070E1A]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo}
        alt={round ? `Karting — ${formatHeroHeadline(round)}` : "Karting BS Proyect"}
        className="absolute inset-x-0 top-0 h-[38svh] w-full object-cover object-[center_45%] md:h-full md:object-[58%_42%]"
        decoding="async"
        fetchPriority="high"
        onError={() => setImgFailed(true)}
      />
      <div className="absolute inset-0 hidden bg-gradient-to-r from-[#070E1A] via-[#070E1A]/60 to-transparent md:block" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070E1A] via-[#070E1A]/25 to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-4.5rem)] w-full max-w-[1480px] flex-col justify-end gap-7 px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[38svh] sm:px-8 md:flex-row md:items-end md:justify-between md:gap-10 md:px-12 md:pb-14 md:pt-10 xl:px-14 xl:pb-20">
        <div className="min-w-0 max-w-[42rem] flex-1">
          {error ? (
            <p className="text-sm text-white">No se pudo cargar la próxima fecha.</p>
          ) : !round ? (
            <p className="text-sm text-[#A7A9AC]">
              No hay fechas próximas en el calendario.
            </p>
          ) : (
            <>
              <p className="text-sm font-black italic uppercase tracking-[0.28em] text-[#E30613] [text-shadow:-1px_0_#000,1px_0_#000,0_1px_#000,0_-1px_#000]">
                {phase === "live"
                  ? "En vivo"
                  : phase === "finished"
                    ? "Última fecha"
                    : "Próxima fecha"}
              </p>
              <h1 className="mt-2 max-w-[18ch] text-[clamp(2.35rem,5.5vw,5.15rem)] font-black italic uppercase leading-[0.92] text-white [text-shadow:-2px_0_#000,2px_0_#000,0_2px_#000,0_-2px_#000]">
                {formatHeroHeadline(round)}
              </h1>
              <p className="mt-3 text-[clamp(1.15rem,2.4vw,1.75rem)] font-black italic uppercase text-[#E30613] [text-shadow:-1px_0_#000,1px_0_#000,0_1px_#000,0_-1px_#000]">
                {dateLabel}
              </p>
              {showCircuit ? (
                <p className="mt-3 text-sm font-bold uppercase tracking-[0.16em] text-white [text-shadow:-1px_0_#000,1px_0_#000,0_1px_#000,0_-1px_#000]">
                  {circuitLabel}
                </p>
              ) : null}
              {countdownRound ? (
                <div className="mt-6">
                  <HeroCountdown
                    round={countdownRound}
                    phase={phase}
                    hasResults={hasResults}
                  />
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="flex w-full flex-col gap-3 md:max-w-[28rem] md:pb-2">
          <HeroButton
            href={`/inscripcion?round=${encodeURIComponent(round?.id ?? "")}`}
            label={closed ? "Inscripción cerrada" : "Inscribirme"}
            variant="primary"
            disabled={closed}
          />
          <HeroButton
            href={`/calendario/${round?.id ?? ""}`}
            label="Más información del evento"
            variant="secondary"
            disabled={!round}
          />
          <HeroButton
            href="/transmision"
            label="Transmisión"
            variant="secondary"
          />
          <HeroButton
            href="/tiempos"
            label="Tiempos"
            variant="secondary"
          />
        </div>
      </div>
    </section>
  );
}

function HeroButton({
  href,
  label,
  variant,
  disabled,
}: {
  href: string;
  label: string;
  variant: "primary" | "secondary";
  disabled?: boolean;
}) {
  const className = [
    "flex min-h-12 items-center justify-center rounded-md px-5 py-3.5 text-sm font-black italic uppercase tracking-[0.16em] text-white transition",
    variant === "primary"
      ? "bg-[#E30613] hover:bg-[#c10510]"
      : "border border-white/85 bg-[#0A1628] hover:bg-[#122038]",
    disabled ? "cursor-not-allowed opacity-55 hover:bg-inherit" : "",
  ].join(" ");

  if (disabled) {
    return (
      <span className={className} aria-disabled="true">
        {label}
      </span>
    );
  }

  return (
    <Link href={href} className={className} aria-label={label}>
      {label}
    </Link>
  );
}
