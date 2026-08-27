/** URL pública del sitio (usar dominio propio en producción si lo tenés). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://www.bsproyect.com";

export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${SITE_URL}${path}`;
}
