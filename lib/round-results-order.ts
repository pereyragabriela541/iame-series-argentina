import type { Category, RoundResult } from "@/lib/types";

/** Orden fijo de PDFs dentro de cada categoría. */
export const RESULT_SESSION_LABELS = [
  "Manga 1",
  "Manga 2",
  "Clasificación",
  "Clasificación Titulares",
  "Clasificación Invitados",
  "Sprint",
  "Sprint Titulares",
  "Sprint Invitados",
  "Final",
  "Final Titulares",
  "Final Invitados",
] as const;

export type ResultSessionLabel = (typeof RESULT_SESSION_LABELS)[number];

const SESSION_ALIASES: Record<string, number> = {
  "manga 1": 0,
  manga1: 0,
  m1: 0,
  "manga 2": 1,
  manga2: 1,
  m2: 1,
  clasificacion: 2,
  clasificación: 2,
  clasif: 2,
  qualifying: 2,
  "clasificacion titulares": 3,
  "clasificación titulares": 3,
  "clasificacion invitados": 4,
  "clasificación invitados": 4,
  sprint: 5,
  "sprint titulares": 6,
  "sprint invitados": 7,
  final: 8,
  fin: 8,
  "final titulares": 9,
  "final invitados": 10,
};

export function getResultSessionOrder(label: string): number {
  const key = label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (key in SESSION_ALIASES) return SESSION_ALIASES[key];

  // Alias más largo primero para que "sprint titulares" gane a "sprint"
  const aliases = Object.entries(SESSION_ALIASES).sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [alias, order] of aliases) {
    if (key.includes(alias)) return order;
  }
  return RESULT_SESSION_LABELS.length;
}

/** sort_order estable: categoría primero, luego sesión. */
export function computeResultSortOrder(
  categorySortOrder: number,
  label: string,
): number {
  return categorySortOrder * 100 + getResultSessionOrder(label);
}

export interface RoundResultCategoryGroup {
  category: Pick<Category, "id" | "name" | "sort_order">;
  results: RoundResult[];
}

type CategoryForResults = Pick<Category, "id" | "name" | "sort_order" | "slug">;

/** En Resultados Master+Gentleman corren juntos; en Campeonato van separados. */
function resultsDisplayName(category: CategoryForResults): string {
  if (category.slug === "master") return "MASTER MY10/GENTLEMAN";
  return category.name;
}

/** Agrupa por categoría y ordena sesiones canónicas. */
export function groupRoundResultsByCategory(
  results: RoundResult[],
  categories: CategoryForResults[],
): RoundResultCategoryGroup[] {
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const byCategory = new Map<string, RoundResult[]>();

  for (const result of results) {
    const list = byCategory.get(result.category_id) ?? [];
    list.push(result);
    byCategory.set(result.category_id, list);
  }

  const orderedCategoryIds = [...byCategory.keys()].sort((a, b) => {
    const ca = catMap[a];
    const cb = catMap[b];
    const orderA = ca?.sort_order ?? 999;
    const orderB = cb?.sort_order ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return (ca?.name ?? a).localeCompare(cb?.name ?? b, "es");
  });

  return orderedCategoryIds.map((categoryId) => {
    const raw = catMap[categoryId] ?? {
      id: categoryId,
      name: "Categoría",
      sort_order: 999,
      slug: "",
    };
    const category = {
      id: raw.id,
      sort_order: raw.sort_order,
      name: resultsDisplayName(raw),
    };
    const sorted = [...(byCategory.get(categoryId) ?? [])].sort((a, b) => {
      const sessionDiff =
        getResultSessionOrder(a.label) - getResultSessionOrder(b.label);
      if (sessionDiff !== 0) return sessionDiff;
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.label.localeCompare(b.label, "es");
    });
    return { category, results: sorted };
  });
}
