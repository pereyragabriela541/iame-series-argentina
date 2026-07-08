/** URL pública del sitio (usar dominio propio en producción si lo tenés). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://www.bsproyect.com";
