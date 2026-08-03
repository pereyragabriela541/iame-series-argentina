import type { AppConfig } from "./types";

export const SPEEDHIVE_PORTAL_URL = "https://speedhive.mylaps.com/";

export function resolveLiveTimingUrl(live?: AppConfig["live"]): string {
  if (!live) return SPEEDHIVE_PORTAL_URL;
  const url = String(
    live.timing_url ?? live.speedhive_url ?? live.mylaps_url ?? "",
  ).trim();
  return url || SPEEDHIVE_PORTAL_URL;
}

export const YOUTUBE_FALLBACK =
  "https://www.youtube.com/results?search_query=karting+argentina";
