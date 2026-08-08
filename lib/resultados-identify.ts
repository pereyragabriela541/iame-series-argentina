/**
 * Reconocimiento determinístico de PDFs de resultados (MyLaps / Realtime).
 *
 * En los PDFs reales de fecha 6 los encabezados de categoría/sesión están
 * embebidos como imágenes; el texto extraíble no los incluye. Por eso:
 * 1) se buscan patrones en texto + metadata del PDF;
 * 2) si faltan, se usa el nombre de archivo (mismas reglas);
 * 3) si no hay match unívoco con categorías/sesiones existentes → needs_review.
 */

import {
  RESULT_SESSION_LABELS,
  type ResultSessionLabel,
} from "./round-results-order";

export type IdentifyStatus = "ready" | "needs_review";

export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface ExistingResultRef {
  id: string;
  category_id: string;
  label: string;
}

export interface PdfExtractInput {
  fileName: string;
  text: string;
  title?: string | null;
}

export interface IdentifyMatch {
  fileName: string;
  status: IdentifyStatus;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  label: ResultSessionLabel | null;
  detectedCategoryRaw: string | null;
  detectedSessionRaw: string | null;
  source: "pdf_text" | "pdf_metadata" | "filename" | "mixed" | null;
  reason: string;
  duplicateResultId: string | null;
}

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Correcciones tipográficas frecuentes en nombres exportados. */
function fixTypos(value: string): string {
  return value
    .replace(/\bSPINT\b/gi, "SPRINT")
    .replace(/\bCLASIFICACIO\b/gi, "CLASIFICACION");
}

type CategoryAlias = { pattern: RegExp; slug: string; raw: string };

/** Más específicos primero (OKN JUNIOR antes que OKN, MINI UNDER antes que MINI). */
const CATEGORY_ALIASES: CategoryAlias[] = [
  { pattern: /\b(?:60\s*)?mini\s*under\b|\b60u\b/, slug: "60-mini-under", raw: "MINI UNDER" },
  { pattern: /\b(?:60\s*)?mini\b|\b60m\b/, slug: "60-mini", raw: "MINI" },
  { pattern: /\bokn\s*junior\b|\boknj\b|\bokn\s*jr\b/, slug: "okn-junior", raw: "OKN JUNIOR" },
  { pattern: /\bokn\b/, slug: "okn", raw: "OKN" },
  {
    pattern: /\bsenior\s*(?:390|pro)|390\s*pro|\bs390h\b/,
    slug: "senior-pro-390-honda",
    raw: "SENIOR 390",
  },
  {
    pattern: /\bold\s*senior\b|\bsenior\s*my10\b|\bsenior\b(?!\s*390)/,
    slug: "senior",
    raw: "SENIOR",
  },
  {
    pattern: /\bold\s*junior\b|\bjunior\s*my10\b|\bjunior\b(?!\s*my10)/,
    slug: "junior",
    raw: "JUNIOR",
  },
  {
    pattern:
      /\bold\s*master(?:\s*[-\/]\s*|\s+)gentleman\b|\bmaster(?:\s*[-\/]\s*|\s+)gentleman\b|\bmaster\s*my10\b|\bgentleman\b|\bmaster\b/,
    slug: "master",
    raw: "MASTER/GENTLEMAN",
  },
  { pattern: /\bacademy(?:\s*\/?\s*honda)?\b|\bacadh\b/, slug: "academy", raw: "ACADEMY" },
];

type SessionAlias = {
  pattern: RegExp;
  label: ResultSessionLabel;
  raw: string;
};

const SESSION_ALIASES: SessionAlias[] = [
  {
    pattern: /\bclasificaci[oó]n\s+titulares?\b|\bqualify(?:ing)?\s+titulares?\b/,
    label: "Clasificación Titulares",
    raw: "CLASIFICACION TITULARES",
  },
  {
    pattern: /\bclasificaci[oó]n\s+invitados?\b|\bqualify(?:ing)?\s+invitados?\b/,
    label: "Clasificación Invitados",
    raw: "CLASIFICACION INVITADOS",
  },
  {
    pattern: /\bsprint\s+titulares?\b|\bcarrera\s+sprint\s+titulares?\b/,
    label: "Sprint Titulares",
    raw: "SPRINT TITULARES",
  },
  {
    pattern: /\bsprint\s+invitados?\b|\bcarrera\s+sprint\s+invitados?\b/,
    label: "Sprint Invitados",
    raw: "SPRINT INVITADOS",
  },
  {
    pattern: /\bfinal\s+titulares?\b/,
    label: "Final Titulares",
    raw: "FINAL TITULARES",
  },
  {
    pattern: /\bfinal\s+invitados?\b/,
    label: "Final Invitados",
    raw: "FINAL INVITADOS",
  },
  {
    pattern: /\bmanga\s*1\b|\bm1\b/,
    label: "Manga 1",
    raw: "MANGA 1",
  },
  {
    pattern: /\bmanga\s*2\b|\bm2\b/,
    label: "Manga 2",
    raw: "MANGA 2",
  },
  {
    pattern: /\bclasificaci[oó]n\b|\bqualify(?:ing|reduced)?\b/,
    label: "Clasificación",
    raw: "CLASIFICACION",
  },
  {
    pattern: /\b(?:carrera\s+)?sprint\b/,
    label: "Sprint",
    raw: "SPRINT",
  },
  {
    pattern: /\bfinal\b|\bfin\b/,
    label: "Final",
    raw: "FINAL",
  },
];

function findCategory(haystack: string): { slug: string; raw: string } | null {
  const n = normalize(haystack);
  for (const alias of CATEGORY_ALIASES) {
    if (alias.pattern.test(n)) return { slug: alias.slug, raw: alias.raw };
  }
  return null;
}

function findSession(haystack: string): { label: ResultSessionLabel; raw: string } | null {
  const n = normalize(haystack);
  for (const alias of SESSION_ALIASES) {
    if (alias.pattern.test(n)) return { label: alias.label, raw: alias.raw };
  }
  return null;
}

/** Patrones tipo "MINI / MINI - SPRINT TITULARES" en texto de página. */
function extractFromPdfText(text: string): {
  category: ReturnType<typeof findCategory>;
  session: ReturnType<typeof findSession>;
} {
  const fixed = fixTypos(text);
  const lines = fixed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  // Buscar líneas compactas con "CAT - SESION" o "CAT / CAT - SESION"
  const headerLine =
    lines.find((line) => {
      const n = normalize(line);
      return (
        n.length <= 80 &&
        (n.includes(" - ") || n.includes("/")) &&
        (findCategory(n) !== null || findSession(n) !== null)
      );
    }) ?? null;

  if (headerLine) {
    return {
      category: findCategory(headerLine),
      session: findSession(headerLine),
    };
  }

  // Algunas exportaciones pegan el encabezado sin saltos
  const compact = normalize(fixed).slice(0, 400);
  return {
    category: findCategory(compact),
    session: findSession(compact),
  };
}

function sessionHintFromTitle(title: string | null | undefined): {
  label: ResultSessionLabel;
  raw: string;
} | null {
  if (!title) return null;
  const n = normalize(title.replace(/\\/g, " "));
  if (n.includes("qualify")) {
    return { label: "Clasificación", raw: "QUALIFY (metadata)" };
  }
  if (n.includes("race")) {
    return { label: "Sprint", raw: "RACE (metadata)" };
  }
  return null;
}

function parseFileName(fileName: string): {
  category: ReturnType<typeof findCategory>;
  session: ReturnType<typeof findSession>;
} {
  const base = fixTypos(fileName.replace(/\.pdf$/i, "").trim());

  // "CARRERA SPRINT - MINI" / "SPRINT - MINI"
  const carreraMatch = base.match(
    /^(?:carrera\s+)?(sprint|clasificaci[oó]n|final|manga\s*[12])\s*[-–—]\s*(.+)$/i,
  );
  if (carreraMatch) {
    return {
      session: findSession(carreraMatch[1]),
      category: findCategory(carreraMatch[2]),
    };
  }

  // "MINI - SPRINT TITULARES" / "ACADEMY - CLASIFICACION"
  const dashParts = base.split(/\s[-–—]\s/);
  if (dashParts.length >= 2) {
    const left = dashParts[0];
    const right = dashParts.slice(1).join(" - ");
    const catLeft = findCategory(left);
    const sessRight = findSession(right);
    if (catLeft && sessRight) {
      return { category: catLeft, session: sessRight };
    }
    const sessLeft = findSession(left);
    const catRight = findCategory(right);
    if (sessLeft && catRight) {
      return { category: catRight, session: sessLeft };
    }
  }

  // "OLD JUNIOR CLASIFICACION TITULARES" / "SPRINT OLD JUNIOR"
  return {
    category: findCategory(base),
    session: findSession(base),
  };
}

function resolveCategory(
  slug: string | null,
  categories: CategoryRef[],
): CategoryRef | null {
  if (!slug) return null;
  return categories.find((category) => category.slug === slug) ?? null;
}

function findDuplicate(
  categoryId: string,
  label: string,
  existing: ExistingResultRef[],
): ExistingResultRef | null {
  const key = normalize(label);
  return (
    existing.find(
      (row) => row.category_id === categoryId && normalize(row.label) === key,
    ) ?? null
  );
}

/**
 * Identifica categoría + sesión a partir de texto/metadata/nombre.
 * Nunca inventa categorías ni labels fuera de los permitidos.
 */
export function identifyResultPdf(
  input: PdfExtractInput,
  categories: CategoryRef[],
  existingForRound: ExistingResultRef[] = [],
): IdentifyMatch {
  const fromText = extractFromPdfText(input.text ?? "");
  const fromMeta = sessionHintFromTitle(input.title);
  const fromName = parseFileName(input.fileName);

  const categoryHit = fromText.category ?? fromName.category;
  let sessionHit = fromText.session ?? fromName.session;

  // Metadata solo afina sesión genérica (Race → Sprint, Qualify → Clasificación)
  // cuando aún no hay titulares/invitados detectados.
  if (!sessionHit && fromMeta) {
    sessionHit = fromMeta;
  } else if (
    sessionHit &&
    fromMeta &&
    (sessionHit.label === "Sprint" || sessionHit.label === "Clasificación") &&
    fromMeta.label !== sessionHit.label &&
    !fromText.session &&
    !fromName.session
  ) {
    // Conflicto metadata vs nada: no debería pasar
  }

  // Preferir sesión más específica del filename si metadata solo dice Sprint/Clasificación
  if (
    fromMeta &&
    fromName.session &&
    (fromMeta.label === "Sprint" || fromMeta.label === "Clasificación") &&
    fromName.session.label.startsWith(fromMeta.label)
  ) {
    sessionHit = fromName.session;
  }

  let source: IdentifyMatch["source"] = null;
  const textHelped = Boolean(fromText.category || fromText.session);
  const nameHelped = Boolean(fromName.category || fromName.session);
  const metaHelped = Boolean(fromMeta) && sessionHit?.raw.includes("metadata");

  if (textHelped && nameHelped) source = "mixed";
  else if (textHelped) source = "pdf_text";
  else if (nameHelped && metaHelped) source = "mixed";
  else if (nameHelped) source = "filename";
  else if (metaHelped) source = "pdf_metadata";

  const category = resolveCategory(categoryHit?.slug ?? null, categories);
  const label = sessionHit?.label ?? null;

  // Validar que el label exista en la lista canónica (nunca inventar)
  const labelAllowed =
    label !== null &&
    (RESULT_SESSION_LABELS as readonly string[]).includes(label);

  if (!category || !labelAllowed || !label) {
    const missing: string[] = [];
    if (!category) {
      missing.push(
        categoryHit
          ? `categoría detectada “${categoryHit.raw}” no existe en la base`
          : "no se pudo detectar la categoría",
      );
    }
    if (!labelAllowed || !label) {
      missing.push(
        sessionHit
          ? `sesión detectada “${sessionHit.raw}” no coincide con las permitidas`
          : "no se pudo detectar el tipo de resultado",
      );
    }
    return {
      fileName: input.fileName,
      status: "needs_review",
      categoryId: category?.id ?? null,
      categoryName: category?.name ?? null,
      categorySlug: category?.slug ?? null,
      label: labelAllowed ? label : null,
      detectedCategoryRaw: categoryHit?.raw ?? null,
      detectedSessionRaw: sessionHit?.raw ?? null,
      source,
      reason: missing.join("; "),
      duplicateResultId: null,
    };
  }

  const duplicate = findDuplicate(category.id, label, existingForRound);

  return {
    fileName: input.fileName,
    status: "ready",
    categoryId: category.id,
    categoryName: category.name,
    categorySlug: category.slug,
    label,
    detectedCategoryRaw: categoryHit?.raw ?? null,
    detectedSessionRaw: sessionHit?.raw ?? null,
    source,
    reason: duplicate
      ? `Duplicado: ya existe “${label}” para ${category.name}`
      : "Listo para cargar",
    duplicateResultId: duplicate?.id ?? null,
  };
}

/** Helper de prueba: identifica solo a partir del nombre (sin PDF). */
export function identifyFromFileName(
  fileName: string,
  categories: CategoryRef[],
  existingForRound: ExistingResultRef[] = [],
): IdentifyMatch {
  return identifyResultPdf(
    { fileName, text: "", title: null },
    categories,
    existingForRound,
  );
}
