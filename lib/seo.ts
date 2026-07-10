import type { Metadata } from "next";
import { BRAND } from "@/lib/branding";
import { SITE_URL } from "@/lib/site";

/** Frases que la gente busca en Google — van en títulos, descripciones y textos visibles. */
export const SEO_KEYWORDS = [
  "IAME Series Argentina",
  "Champion Cup 2026",
  "karting IAME Argentina",
  "inscripción IAME",
  "calendario karting Argentina",
] as const;

const defaultDescription =
  "Sitio oficial de IAME Series Argentina y Champion Cup 2026: calendario de karting, campeonato, resultados en vivo, inscripción IAME y noticias del karting en Argentina.";

export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description?: string;
  path?: string;
}): Metadata {
  const fullTitle = title.includes(BRAND.name) ? title : `${title} | ${BRAND.name}`;
  const desc = description ?? defaultDescription;

  return {
    title: fullTitle,
    description: desc,
    openGraph: {
      title: fullTitle,
      description: desc,
      ...(path ? { url: `${SITE_URL}${path}` } : {}),
    },
  };
}

export const homeMetadata: Metadata = pageMetadata({
  title: `${BRAND.name} | Champion Cup 2026 — Sitio Oficial`,
  description:
    "Campeonato oficial de karting IAME en Argentina. Calendario karting Argentina, inscripción IAME, resultados en vivo, campeonato Champion Cup 2026 y noticias de IAME Series Argentina.",
  path: "/",
});

export const calendarMetadata = pageMetadata({
  title: "Calendario karting Argentina — Champion Cup 2026",
  description:
    "Calendario oficial del Champion Cup 2026 e IAME Series Argentina: fechas, circuitos y próximas carreras de karting IAME en Argentina.",
  path: "/calendario",
});

export const inscriptionMetadata = pageMetadata({
  title: "Inscripción IAME — Champion Cup 2026",
  description:
    "Inscripción oficial al campeonato IAME Series Argentina y Champion Cup 2026. Formulario online, categorías y reserva de turnos de karting en Argentina.",
  path: "/inscripcion",
});

export const championshipMetadata = pageMetadata({
  title: "Campeonato — Champion Cup 2026",
  description:
    "Posiciones y puntos del campeonato IAME Series Argentina. Champion Cup 2026: clasificación por categoría del karting IAME en Argentina.",
  path: "/campeonato",
});

export const newsMetadata = pageMetadata({
  title: "Noticias — IAME Series Argentina",
  description:
    "Novedades del karting IAME en Argentina: comunicados, flyers y noticias del Champion Cup 2026 e IAME Series Argentina.",
  path: "/noticias",
});
