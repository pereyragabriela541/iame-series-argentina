const FINAL_IAME_SLUG = "final-iame-argentina-2026";
const NEWS_MEDIA =
  "https://ekhnxlliyblbslgragia.supabase.co/storage/v1/object/public/event-media/noticias";
const NEWS_CACHE = "v=20260826-4p";

function newsMedia(file: string): string {
  return `${NEWS_MEDIA}/${file}?${NEWS_CACHE}`;
}

export function extraNewsImages(slug: string | null | undefined): string[] {
  if (slug !== FINAL_IAME_SLUG) return [];
  return [
    newsMedia("final-iame-argentina-2026.png"),
    newsMedia("final-iame-argentina-2026-p2.png"),
    newsMedia("final-iame-argentina-2026-p3.png"),
    newsMedia("final-iame-argentina-2026-p4.png"),
  ];
}

export function newsPdf(
  slug: string | null | undefined,
): { href: string; label: string } | null {
  if (slug !== FINAL_IAME_SLUG) return null;
  return {
    href: newsMedia("final-iame-argentina-2026.pdf"),
    label: "Flyer completo (PDF)",
  };
}
