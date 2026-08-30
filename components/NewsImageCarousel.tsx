"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface NewsImageCarouselProps {
  images: string[];
  title: string;
}

export default function NewsImageCarousel({
  images,
  title,
}: NewsImageCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragOrigin = useRef<{ x: number; y: number } | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxIndex(null);
        return;
      }
      if (event.key === "ArrowLeft") {
        setLightboxIndex((current) =>
          current === null ? current : Math.max(current - 1, 0),
        );
      }
      if (event.key === "ArrowRight") {
        setLightboxIndex((current) =>
          current === null ? current : Math.min(current + 1, images.length - 1),
        );
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightboxIndex, images.length]);

  if (!images.length) return null;

  const goTo = (index: number) => {
    const nextIndex = Math.min(Math.max(index, 0), images.length - 1);
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: track.clientWidth * nextIndex, behavior: "smooth" });
    setActiveIndex(nextIndex);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  return (
    <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-iame-navy">
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
            className="w-full shrink-0 snap-center bg-iame-navy"
          >
            <button
              type="button"
              className="block w-full cursor-zoom-in"
              aria-label={`Ampliar ${title} — página ${index + 1} de ${images.length}`}
              onPointerDown={(event) => {
                dragOrigin.current = { x: event.clientX, y: event.clientY };
              }}
              onClick={(event) => {
                const origin = dragOrigin.current;
                dragOrigin.current = null;
                if (
                  origin &&
                  (Math.abs(event.clientX - origin.x) >= 10 ||
                    Math.abs(event.clientY - origin.y) >= 10)
                ) {
                  return;
                }
                openLightbox(index);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${title} — página ${index + 1} de ${images.length}`}
                className="block h-auto w-full"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </button>
          </div>
        ))}
      </div>

      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
        Ampliar
      </span>

      {images.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label="Página anterior"
            className="absolute left-3 grid h-11 w-11 place-items-center rounded-full border border-white/30 bg-black/65 text-2xl text-white shadow-lg transition hover:bg-black/85 disabled:cursor-default disabled:opacity-25"
            style={{ top: "min(36svh, 50%)", transform: "translateY(-50%)" }}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            disabled={activeIndex === images.length - 1}
            aria-label="Página siguiente"
            className="absolute right-3 grid h-11 w-11 place-items-center rounded-full border border-white/30 bg-black/65 text-2xl text-white shadow-lg transition hover:bg-black/85 disabled:cursor-default disabled:opacity-25"
            style={{ top: "min(36svh, 50%)", transform: "translateY(-50%)" }}
          >
            ›
          </button>

          <div
            className="absolute inset-x-0 flex items-center justify-center"
            style={{ top: "min(calc(100% - 3.25rem), 70svh)" }}
          >
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

      {mounted && lightboxIndex !== null
        ? createPortal(
            <div
              className="fixed inset-0 z-[80] bg-black/95"
              role="dialog"
              aria-modal="true"
              aria-label={`${title} en grande`}
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                aria-label="Cerrar"
                className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full border border-white/30 bg-black/70 text-2xl text-white hover:bg-black/90"
              >
                ×
              </button>

              {images.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIndex((current) =>
                        current === null ? current : Math.max(current - 1, 0),
                      )
                    }
                    disabled={lightboxIndex === 0}
                    aria-label="Página anterior"
                    className="absolute left-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-black/70 text-2xl text-white hover:bg-black/90 disabled:opacity-25"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIndex((current) =>
                        current === null
                          ? current
                          : Math.min(current + 1, images.length - 1),
                      )
                    }
                    disabled={lightboxIndex === images.length - 1}
                    aria-label="Página siguiente"
                    className="absolute right-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-black/70 text-2xl text-white hover:bg-black/90 disabled:opacity-25"
                  >
                    ›
                  </button>
                </>
              ) : null}

              <div
                className="h-full overflow-y-auto"
                onClick={() => setLightboxIndex(null)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={images[lightboxIndex]}
                  alt={`${title} — página ${lightboxIndex + 1} de ${images.length}`}
                  className="mx-auto block h-auto w-full"
                  onClick={(event) => event.stopPropagation()}
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
