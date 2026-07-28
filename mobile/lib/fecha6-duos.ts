/** Orden de categorías del campeonato (alineado a inscripción). */
const CATEGORY_ORDER = [
  "60-mini",
  "60-mini-under",
  "junior",
  "senior",
  "master",
  "master-gentleman",
  "okn-junior",
  "okn",
  "senior-pro-390-honda",
  "academy",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  "60-mini": "60 MINI",
  "60-mini-under": "60 MINI UNDER",
  junior: "JUNIOR MY10",
  senior: "SENIOR MY10",
  master: "MASTER MY10",
  "master-gentleman": "GENTLEMAN",
  "okn-junior": "OKN JUNIOR",
  okn: "OKN",
  "senior-pro-390-honda": "SENIOR 390 PRO/HONDA",
  academy: "ACADEMY/HONDA",
};

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

const ORDER_INDEX = new Map(CATEGORY_ORDER.map((slug, i) => [slug, i]));

function categorySortKey(duo: Fecha6Duo): number {
  const slug = duo.categorySlug.trim();
  if (slug && ORDER_INDEX.has(slug)) return ORDER_INDEX.get(slug)!;
  const label = duo.categoryLabel.trim().toUpperCase();
  const byLabel = CATEGORY_ORDER.findIndex(
    (s) => (CATEGORY_LABELS[s] ?? "").toUpperCase() === label,
  );
  if (byLabel >= 0) return byLabel;
  return 1000;
}

function kartSortKey(kart: string): number {
  const n = Number.parseInt(String(kart).replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : 99999;
}

/** Agrupa y ordena dúos por categoría; dentro, por kart y antigüedad. */
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
