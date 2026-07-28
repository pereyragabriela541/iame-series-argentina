import { INSCRIPTION_CATEGORIES } from "@/lib/inscription-data";

export interface Fecha6Duo {
  id: string;
  titularName: string;
  guestName: string;
  kartNumber: string;
  categorySlug: string;
  categoryLabel: string;
  photoTitularUrl: string;
  photoInvitadoUrl: string;
  createdAt: string;
}

export interface Fecha6DuoCategoryGroup {
  categorySlug: string;
  categoryLabel: string;
  duos: Fecha6Duo[];
}

const CATEGORY_ORDER = new Map(
  INSCRIPTION_CATEGORIES.map((c, index) => [c.value, index]),
);

function categorySortKey(duo: Fecha6Duo): number {
  const slug = duo.categorySlug.trim();
  if (slug && CATEGORY_ORDER.has(slug)) return CATEGORY_ORDER.get(slug)!;
  const label = duo.categoryLabel.trim().toUpperCase();
  const byLabel = INSCRIPTION_CATEGORIES.findIndex(
    (c) => c.label.toUpperCase() === label,
  );
  if (byLabel >= 0) return byLabel;
  return 1000;
}

function kartSortKey(kart: string): number {
  const n = Number.parseInt(String(kart).replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : 99999;
}

/** Agrupa y ordena dúos por categoría del campeonato; dentro, por kart y antigüedad. */
export function groupFecha6DuosByCategory(
  duos: Fecha6Duo[],
): Fecha6DuoCategoryGroup[] {
  const sorted = [...duos].sort((a, b) => {
    const cat = categorySortKey(a) - categorySortKey(b);
    if (cat !== 0) return cat;
    const kart = kartSortKey(a.kartNumber) - kartSortKey(b.kartNumber);
    if (kart !== 0) return kart;
    return String(a.createdAt).localeCompare(String(b.createdAt));
  });

  const groups: Fecha6DuoCategoryGroup[] = [];
  const indexByKey = new Map<string, number>();

  for (const duo of sorted) {
    const label = duo.categoryLabel.trim() || "Sin categoría";
    const slug = duo.categorySlug.trim() || label.toLowerCase();
    const key = `${slug}::${label.toUpperCase()}`;
    let idx = indexByKey.get(key);
    if (idx == null) {
      idx = groups.length;
      indexByKey.set(key, idx);
      groups.push({
        categorySlug: slug,
        categoryLabel: label,
        duos: [],
      });
    }
    groups[idx].duos.push(duo);
  }

  return groups;
}
