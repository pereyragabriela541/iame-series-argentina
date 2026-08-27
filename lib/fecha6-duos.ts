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

function kartSortKey(kart: string): number {
  const n = Number.parseInt(String(kart).replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : 99999;
}

/** Agrupa dúos por categoría. El orden de categorías viene de Supabase (slugs). */
export function groupFecha6DuosByCategory(
  duos: Fecha6Duo[],
  categorySlugsInOrder: string[] = [],
): Fecha6DuoCategoryGroup[] {
  const order = new Map(
    categorySlugsInOrder.map((slug, index) => [slug, index]),
  );

  const sorted = [...duos].sort((a, b) => {
    const aIdx = order.has(a.categorySlug)
      ? order.get(a.categorySlug)!
      : 1000;
    const bIdx = order.has(b.categorySlug)
      ? order.get(b.categorySlug)!
      : 1000;
    if (aIdx !== bIdx) return aIdx - bIdx;
    const label = a.categoryLabel.localeCompare(b.categoryLabel, "es");
    if (label !== 0) return label;
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
