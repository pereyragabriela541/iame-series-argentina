import type { Category, RoundResult } from "@/lib/types";

/** Orden fijo de PDFs dentro de cada categoría. */
export const RESULT_SESSION_LABELS = [
  "Manga 1",
  "Manga 2",
  "Clasificación",
  "Sprint",
  "Final",
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
  sprint: 3,
  final: 4,
  fin: 4,
};

export function getResultSessionOrder(label: string): number {
  const key = label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (key in SESSION_ALIASES) return SESSION_ALIASES[key];

  for (const [alias, order] of Object.entries(SESSION_ALIASES)) {
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

/** Agrupa por categoría y ordena Manga 1 → Manga 2 → Clasificación → Sprint → Final. */
export function groupRoundResultsByCategory(
  results: RoundResult[],
  categories: Array<Pick<Category, "id" | "name" | "sort_order">>,
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
    const category = catMap[categoryId] ?? {
      id: categoryId,
      name: "Categoría",
      sort_order: 999,
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
