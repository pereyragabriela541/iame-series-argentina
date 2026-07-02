import type {
  AppConfig,
  Category,
  FormDoc,
  MediaImage,
  MediaVideo,
  NewsArticle,
  Notification,
  Regulation,
  Round,
  RoundResult,
  Schedule,
  Season,
  Standing,
} from "@/lib/types";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function getActiveSeason(): Promise<Season | null> {
  const sb = createSupabaseServer();
  const { data } = await sb
    .from("seasons")
    .select("*")
    .eq("is_active", true)
    .single();
  return data;
}

export async function getAppConfig(): Promise<AppConfig> {
  const sb = createSupabaseServer();
  const { data } = await sb.from("app_config").select("key, value");
  const config: AppConfig = {};
  for (const row of data ?? []) {
    (config as Record<string, unknown>)[row.key] = row.value;
  }
  return config;
}

export async function getCategories(): Promise<Category[]> {
  const sb = createSupabaseServer();
  const { data } = await sb
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}

export async function getRounds(seasonId: string): Promise<Round[]> {
  const sb = createSupabaseServer();
  const { data } = await sb
    .from("rounds")
    .select("*")
    .eq("season_id", seasonId)
    .order("sort_order");
  return data ?? [];
}

export async function getRoundById(id: string): Promise<Round | null> {
  const sb = createSupabaseServer();
  const { data } = await sb.from("rounds").select("*").eq("id", id).single();
  return data;
}

export async function getRoundResults(roundId: string): Promise<RoundResult[]> {
  const sb = createSupabaseServer();
  const { data } = await sb
    .from("round_results")
    .select("*, categories(*)")
    .eq("round_id", roundId)
    .order("sort_order");
  return (data ?? []) as RoundResult[];
}

export async function getStandings(
  seasonId: string,
  categoryId: string
): Promise<Standing[]> {
  const sb = createSupabaseServer();
  const { data } = await sb
    .from("standings")
    .select("*")
    .eq("season_id", seasonId)
    .eq("category_id", categoryId)
    .order("position", { ascending: true, nullsFirst: false });
  return data ?? [];
}

export async function getNews(limit = 20): Promise<NewsArticle[]> {
  const sb = createSupabaseServer();
  const { data } = await sb
    .from("news")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getNewsBySlug(slug: string): Promise<NewsArticle | null> {
  const sb = createSupabaseServer();
  const { data } = await sb
    .from("news")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();
  return data;
}

export async function getRegulations(): Promise<Regulation[]> {
  const sb = createSupabaseServer();
  const { data } = await sb
    .from("regulations")
    .select("*")
    .eq("is_published", true)
    .order("sort_order");
  return data ?? [];
}

export async function getSchedules(): Promise<Schedule[]> {
  const sb = createSupabaseServer();
  const { data } = await sb
    .from("schedules")
    .select("*")
    .eq("is_published", true)
    .order("sort_order");
  return data ?? [];
}

export async function getForms(): Promise<FormDoc[]> {
  const sb = createSupabaseServer();
  const { data } = await sb
    .from("forms")
    .select("*")
    .eq("is_published", true)
    .order("sort_order");
  return data ?? [];
}

export async function getMediaImages(): Promise<MediaImage[]> {
  const sb = createSupabaseServer();
  const { data } = await sb
    .from("media_images")
    .select("*")
    .eq("is_published", true)
    .order("sort_order");
  return data ?? [];
}

export async function getMediaVideos(): Promise<MediaVideo[]> {
  const sb = createSupabaseServer();
  const { data } = await sb
    .from("media_videos")
    .select("*")
    .eq("is_published", true)
    .order("sort_order");
  return data ?? [];
}

export async function getNotifications(): Promise<Notification[]> {
  const sb = createSupabaseServer();
  const { data } = await sb
    .from("notifications")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });
  return data ?? [];
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
