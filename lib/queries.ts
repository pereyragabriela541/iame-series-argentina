import type {
  AppConfig,
  Category,
  FormDoc,
  MediaImage,
  MediaSection,
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
import type { Fecha6Duo } from "@/lib/fecha6-duos";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
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

/** Dúos Fecha 6 con fotos (titular + invitado), más recientes primero. */
export async function getFecha6Duos(limit = 200): Promise<Fecha6Duo[]> {
  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("registrations")
    .select("id, full_name, kart_number, extra, created_at")
    .eq("round_key", "fecha-6")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const duos: Fecha6Duo[] = [];
  for (const row of data ?? []) {
    const extra = (row.extra ?? {}) as Record<string, unknown>;
    if (extra.format !== "titular_invitado") continue;
    if (extra.show_in_duos === false) continue;
    const photoTitularUrl = String(extra.photo_titular_url ?? "").trim();
    const photoInvitadoUrl = String(extra.photo_invitado_url ?? "").trim();
    const guestName = String(extra.guest_full_name ?? "").trim();
    if (!photoTitularUrl || !photoInvitadoUrl || !guestName) continue;

    duos.push({
      id: row.id,
      titularName: row.full_name,
      guestName,
      kartNumber: row.kart_number ?? "",
      categoryLabel: String(extra.category_label ?? ""),
      photoTitularUrl,
      photoInvitadoUrl,
      createdAt: row.created_at,
    });
  }
  return duos;
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
    .select("*, rounds(round_number, name)")
    .eq("is_published", true)
    .order("sort_order");
  return (data ?? []) as MediaImage[];
}

export async function getMediaVideos(): Promise<MediaVideo[]> {
  const sb = createSupabaseServer();
  const { data } = await sb
    .from("media_videos")
    .select("*, rounds(round_number, name)")
    .eq("is_published", true)
    .order("sort_order");
  return (data ?? []) as MediaVideo[];
}

export async function getMediaSections(
  mediaType?: "images" | "videos",
): Promise<MediaSection[]> {
  const sb = createSupabaseServer();
  let query = sb
    .from("media_sections")
    .select("*")
    .eq("is_published", true)
    .order("sort_order");
  if (mediaType) query = query.eq("media_type", mediaType);
  const { data, error } = await query;
  if (error) {
    // Tabla aún no migrada
    return [];
  }
  return (data ?? []) as MediaSection[];
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
