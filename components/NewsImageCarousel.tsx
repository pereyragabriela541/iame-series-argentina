"use client";

import { useRef, useState } from "react";

interface NewsImageCarouselProps {
  images: string[];
  title: string;
}

export default function NewsImageCarousel({
  images,
  title,
}: NewsImageCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images.length) return null;

  const goTo = (index: number) => {
    const nextIndex = Math.min(Math.max(index, 0), images.length - 1);
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: track.clientWidth * nextIndex, behavior: "smooth" });
    setActiveIndex(nextIndex);
  };

  return (
    <div className="relative overflow-hidden bg-iame-navy">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={(event) => {
          const track = event.currentTarget;
          if (!track.clientWidth) return;
          const nextIndex = Math.round(track.scrollLeft / track.clientWidth);
          if (nextIndex !== activeIndex) setActiveIndex(nextIndex);
        }}
        aria-label={`${title}: ${images.length} páginas`}
      >
        {images.map((src, index) => (
          <div
            key={src}
            className="flex snap-center items-center justify-center bg-iame-navy"
            style={{
              flexShrink: 0,
              width: "100%",
              height: "min(62svh, 48rem)",
              minHeight: "22rem",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${title} — página ${index + 1} de ${images.length}`}
              className="h-full w-full object-contain"
              loading={index === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>

      {images.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label="Página anterior"
            className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-black/65 text-2xl text-white shadow-lg transition hover:bg-black/85 disabled:cursor-default disabled:opacity-25"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            disabled={activeIndex === images.length - 1}
            aria-label="Página siguiente"
            className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-black/65 text-2xl text-white shadow-lg transition hover:bg-black/85 disabled:cursor-default disabled:opacity-25"
          >
            ›
          </button>

          <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
            <div className="flex items-center gap-2 rounded-full bg-black/70 px-3 py-2 shadow-lg backdrop-blur-sm">
              {images.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Ir a la página ${index + 1}`}
                  aria-current={index === activeIndex ? "true" : undefined}
                  className={`h-2.5 w-2.5 rounded-full border border-white/70 transition ${
                    index === activeIndex ? "bg-iame-red" : "bg-white/35"
                  }`}
                />
              ))}
              <span className="ml-1 text-[10px] font-bold tabular-nums text-white">
                {activeIndex + 1}/{images.length}
              </span>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
