import type { AppConfig } from "@/lib/types";

/** URL de cronometraje — mismos criterios que CAK (Speedhive / MyLaps). */
export function resolveLiveTimingUrl(live?: AppConfig["live"]): string | null {
  if (!live) return null;

  const url = String(
    live.timing_url ??
      live.speedhive_url ??
      live.mylaps_url ??
      ""
  ).trim();

  return url || null;
}
