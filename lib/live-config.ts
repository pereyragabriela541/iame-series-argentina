import type { AppConfig } from "@/lib/types";

export const SPEEDHIVE_PORTAL_URL = "https://speedhive.mylaps.com/";

/** URL de cronometraje — portal Speedhive o sesión específica en app_config. */
export function resolveLiveTimingUrl(live?: AppConfig["live"]): string {
  if (!live) return SPEEDHIVE_PORTAL_URL;

  const url = String(
    live.timing_url ??
      live.speedhive_url ??
      live.mylaps_url ??
      ""
  ).trim();

  return url || SPEEDHIVE_PORTAL_URL;
}
