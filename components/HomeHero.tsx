"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BRAND } from "@/lib/branding";

interface HomeHeroProps {
  year: number;
  regularRounds: number;
}

export default function HomeHero({ year, regularRounds }: HomeHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onEnded = () => setEnded(true);

    video.addEventListener("ended", onEnded);

    const tryPlayWithSound = async () => {
      video.muted = false;
      video.volume = 1;

      try {
        await video.play();
        setSoundOn(true);
        setNeedsTap(false);
      } catch {
        video.muted = true;
        try {
          await video.play();
          setSoundOn(false);
          setNeedsTap(true);
        } catch {
          setNeedsTap(true);
        }
      }
    };

    void tryPlayWithSound();

    return () => video.removeEventListener("ended", onEnded);
  }, []);

  function toggleSound() {
    const video = videoRef.current;
    if (!video || ended) return;

    if (video.muted) {
      video.muted = false;
      video.volume = 1;
      setSoundOn(true);
      setNeedsTap(false);
      if (video.paused) void video.play();
      return;
    }

    video.muted = true;
    setSoundOn(false);
  }

  return (
    <section className="relative left-1/2 min-h-[min(88vh,820px)] w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden border-y border-neutral-800">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src="/assets/hero-iame.mp4"
        autoPlay
        playsInline
        preload="auto"
        aria-hidden
      />

      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/75" />
      <div className="absolute inset-0 bg-gradient-to-t from-carbon via-transparent to-black/40" />

      <div className="relative z-10 flex min-h-[min(88vh,820px)] flex-col justify-center p-6 sm:p-10 lg:p-14">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-iame-red">
            Champion Cup {year}
          </p>
          <h1 className="mt-2 text-3xl font-black uppercase italic tracking-tight text-white sm:text-5xl lg:text-6xl">
            {BRAND.name}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-neutral-200 sm:text-base">
            Calendario karting Argentina, campeonato Champion Cup {year}, resultados en vivo
            e inscripción IAME. Sitio oficial de IAME Series Argentina.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/campeonato"
              className="bg-iame-red px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-iame-red/90"
            >
              Campeonato
            </Link>
            <Link
              href="/calendario"
              className="border border-iame-navy bg-iame-navy/40 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-iame-navy/60"
            >
              Calendario
            </Link>
          </div>
        </div>
      </div>

      {!ended && (
        <button
          type="button"
          onClick={toggleSound}
          className="absolute bottom-5 right-5 z-20 border border-white/20 bg-black/50 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-white backdrop-blur-sm hover:bg-black/70"
          aria-label={soundOn ? "Silenciar video" : "Activar sonido del video"}
        >
          {needsTap && !soundOn ? "Activar sonido" : soundOn ? "Silenciar" : "Activar sonido"}
        </button>
      )}
    </section>
  );
}
