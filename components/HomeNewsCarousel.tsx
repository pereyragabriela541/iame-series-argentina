"use client";

import { useEffect, useRef, useState } from "react";
import NewsCard from "@/components/NewsCard";
import { activeCarouselIndex, carouselLayout } from "@/lib/carousel-index";
import type { NewsArticle } from "@/lib/types";

function cardOffsetsFromTrack(track: HTMLDivElement): number[] {
  return Array.from(
    track.querySelectorAll<HTMLElement>("[data-news-card]"),
    (card) => card.offsetLeft,
  );
}

export default function HomeNewsCarousel({
  articles,
}: {
  articles: NewsArticle[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showArrows, setShowArrows] = useState(false);
  const [layout, setLayout] = useState({ cardWidth: "85%", endPad: "15%" });

  useEffect(() => {
    const sync = () => {
      setShowArrows(window.innerWidth >= 768);
      setLayout(carouselLayout(window.innerWidth));
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const syncIndex = (track: HTMLDivElement) => {
    const maxScroll = track.scrollWidth - track.clientWidth;
    const nextIndex = activeCarouselIndex(
      track.scrollLeft,
      maxScroll,
      cardOffsetsFromTrack(track),
    );
    setActiveIndex((current) => (current === nextIndex ? current : nextIndex));
  };

  const goTo = (index: number) => {
    const nextIndex = Math.min(Math.max(index, 0), articles.length - 1);
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelectorAll<HTMLElement>("[data-news-card]")[
      nextIndex
    ];
    if (!card) return;

    const maxScroll = Math.max(track.scrollWidth - track.clientWidth, 0);
    const left =
      nextIndex === articles.length - 1 ? maxScroll : card.offsetLeft;
    track.scrollTo({ left, behavior: "smooth" });
    setActiveIndex(nextIndex);
  };

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="relative flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          scrollSnapType: "x mandatory",
        }}
        onScroll={(event) => syncIndex(event.currentTarget)}
        aria-label="Carrusel de noticias"
      >
        {articles.map((article) => (
          <div
            key={article.id}
            data-news-card
            className="shrink-0"
            style={{
              width: layout.cardWidth,
              scrollSnapAlign: "start",
            }}
          >
            <NewsCard article={article} />
          </div>
        ))}
        <div
          aria-hidden="true"
          className="shrink-0"
          style={{ width: layout.endPad }}
        />
      </div>

      {articles.length > 1 ? (
        <>
          {showArrows ? (
            <>
              <button
                type="button"
                onClick={() => goTo(activeIndex - 1)}
                disabled={activeIndex === 0}
                aria-label="Noticia anterior"
                className="absolute left-2 top-[5.5rem] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/75 text-2xl text-white shadow-lg transition hover:bg-black disabled:opacity-25"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => goTo(activeIndex + 1)}
                disabled={activeIndex === articles.length - 1}
                aria-label="Noticia siguiente"
                className="absolute right-2 top-[5.5rem] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/75 text-2xl text-white shadow-lg transition hover:bg-black disabled:opacity-25"
              >
                ›
              </button>
            </>
          ) : null}

          <div className="mt-3 flex justify-center gap-2">
            {articles.map((article, index) => (
              <button
                key={article.id}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Ir a la noticia ${index + 1}`}
                aria-current={index === activeIndex ? "true" : undefined}
                className={`h-2.5 w-2.5 rounded-full border border-white/60 transition ${
                  index === activeIndex ? "bg-iame-red" : "bg-white/20"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
