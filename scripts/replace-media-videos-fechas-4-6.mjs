import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  try {
    const raw = readFileSync(join(root, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq);
      let value = trimmed.slice(eq + 1);
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env.local is optional when the variables are provided by the environment.
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const sb = createClient(url, key);

const videos = [
  {
    roundNumber: 4,
    title: "Resumen de la Fecha 4 — Domingo de finales",
    subtitle: "Kartódromo Internacional de Zárate",
    videoUrl: "/videos/fecha-4/resumen-final-vertical.mp4",
    posterUrl: "/videos/fecha-4/resumen-final-poster.jpg",
  },
  {
    roundNumber: 6,
    title: "Resumen de la Fecha 6 — Domingo de finales",
    subtitle: "Kartódromo Ramiro Tot — Baradero",
    videoUrl: "/videos/fecha-6/resumen-final-vertical.mp4",
    posterUrl: "/videos/fecha-6/resumen-final-poster.jpg",
  },
];

const { data: season, error: seasonError } = await sb
  .from("seasons")
  .select("id")
  .eq("is_active", true)
  .single();

if (seasonError || !season) {
  console.error("No se encontró la temporada activa:", seasonError?.message);
  process.exit(1);
}

const { data: rounds, error: roundsError } = await sb
  .from("rounds")
  .select("id, round_number, name")
  .eq("season_id", season.id)
  .in("round_number", videos.map((video) => video.roundNumber));

if (roundsError) {
  console.error("No se pudieron consultar las fechas:", roundsError.message);
  process.exit(1);
}

const roundByNumber = new Map(rounds.map((round) => [round.round_number, round]));
const missingRounds = videos.filter((video) => !roundByNumber.has(video.roundNumber));

if (missingRounds.length) {
  console.error(`No se encontraron las fechas: ${missingRounds.map((item) => item.roundNumber).join(", ")}`);
  process.exit(1);
}

const roundIds = videos.map((video) => roundByNumber.get(video.roundNumber).id);

const { error: videosDeleteError } = await sb
  .from("media_videos")
  .delete()
  .in("round_id", roundIds);

if (videosDeleteError) {
  console.error("No se pudieron limpiar los videos anteriores:", videosDeleteError.message);
  process.exit(1);
}

const videoRows = videos.map((video) => ({
  title: video.title,
  video_url: video.videoUrl,
  thumbnail_url: video.posterUrl,
  round_id: roundByNumber.get(video.roundNumber).id,
  sort_order: 1,
  is_published: true,
}));

const { data: insertedVideos, error: videosInsertError } = await sb
  .from("media_videos")
  .insert(videoRows)
  .select("id, video_url");

if (videosInsertError) {
  console.error("No se pudieron publicar los videos seleccionados:", videosInsertError.message);
  process.exit(1);
}

const { error: sectionsDeleteError } = await sb
  .from("media_sections")
  .delete()
  .eq("media_type", "videos")
  .in("round_id", roundIds);

if (sectionsDeleteError) {
  console.error("No se pudieron limpiar las secciones anteriores:", sectionsDeleteError.message);
  process.exit(1);
}

const sectionRows = videos.map((video, index) => ({
  media_type: "videos",
  round_id: roundByNumber.get(video.roundNumber).id,
  section_key: "main",
  title: `FECHA ${video.roundNumber}`,
  subtitle: video.subtitle,
  description: null,
  sort_order: index + 1,
  is_published: true,
}));

const { error: sectionsInsertError } = await sb.from("media_sections").insert(sectionRows);

if (sectionsInsertError) {
  console.error("Los videos se actualizaron, pero no se pudieron publicar sus encabezados:", sectionsInsertError.message);
  process.exit(1);
}

console.log(`Videos actualizados: ${insertedVideos.length} resúmenes publicados.`);
