import type { AppConfig } from "@/lib/types";

export const SPEEDHIVE_PORTAL_URL = "https://speedhive.mylaps.com/";

function configuredLiveTimingUrl(live?: AppConfig["live"]): string {
  return String(
    live?.timing_url ?? live?.speedhive_url ?? live?.mylaps_url ?? "",
  ).trim();
}

/** URL de cronometraje — portal Speedhive o sesión específica en app_config. */
export function resolveLiveTimingUrl(live?: AppConfig["live"]): string {
  return configuredLiveTimingUrl(live) || SPEEDHIVE_PORTAL_URL;
}

export function hasLiveTimingUrl(live?: AppConfig["live"]): boolean {
  return configuredLiveTimingUrl(live).length > 0;
}

export const YOUTUBE_FALLBACK = "https://www.youtube.com/@IAMESERIESARG";

/** URL de YouTube — editable en Supabase `app_config` key `transmision`.url */
export function resolveYoutubeUrl(transmision?: AppConfig["transmision"]): string {
  return String(transmision?.url ?? "").trim() || YOUTUBE_FALLBACK;
}

export function hasTransmisionUrl(transmision?: AppConfig["transmision"]): boolean {
  return resolveYoutubeUrl(transmision).length > 0;
}
