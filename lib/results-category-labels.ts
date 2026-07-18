/** Nombres solo para resultados PDF. El resto del sitio usa el nombre real de la categoría. */
const RESULTS_CATEGORY_LABELS: Record<string, string> = {
  junior: "OLD JUNIOR",
  senior: "OLD SENIOR",
  "master-my10": "OLD MASTER",
};

export function resultsCategoryName(slug: string | null | undefined, name: string) {
  if (!slug) return name;
  return RESULTS_CATEGORY_LABELS[slug] ?? name;
}
