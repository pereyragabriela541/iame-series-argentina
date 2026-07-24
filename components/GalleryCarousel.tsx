"use client";

import { useCallback, useEffect, useState } from "react";

import type { MediaImage } from "@/lib/types";

export default function GalleryCarousel({ images }: { images: MediaImage[] }) {
  const [index, setIndex] = useState(0);
  const total = images.length;

  const go = useCallback(
    (next: number) => {
      if (!total) return;
      setIndex(((next % total) + total) % total);
    },
    [total],
  );

  useEffect(() => {
    setIndex(0);
  }, [images]);

  if (!total) return null;

  const current = images[index];

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden border border-neutral-800 bg-neutral-950">
        <div className="aspect-video bg-cover bg-center" style={{ backgroundImage: `url(${current.image_url})` }}>
          <a
            href={current.image_url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0"
            aria-label={current.title || `Foto ${index + 1} de ${total}`}
          />
        </div>

        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 border border-neutral-700 bg-black/70 px-3 py-2 text-sm font-bold text-white hover:bg-black/90"
              aria-label="Foto anterior"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 border border-neutral-700 bg-black/70 px-3 py-2 text-sm font-bold text-white hover:bg-black/90"
              aria-label="Foto siguiente"
            >
              ›
            </button>
            <div className="absolute bottom-2 right-2 border border-neutral-700 bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-200">
              {index + 1}/{total}
            </div>
          </>
        ) : null}
      </div>

      {current.title ? (
        <p className="text-xs font-semibold uppercase text-white">{current.title}</p>
      ) : null}

      {total > 1 ? (
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-14 w-20 overflow-hidden border bg-cover bg-center ${
                i === index
                  ? "border-iame-sky"
                  : "border-neutral-800 opacity-70 hover:opacity-100"
              }`}
              style={{ backgroundImage: `url(${img.image_url})` }}
              aria-label={`Ir a foto ${i + 1}`}
              aria-current={i === index}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
