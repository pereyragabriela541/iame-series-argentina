#!/usr/bin/env node
/** Publica la reprogramación de Fecha 7 y confirma Zárate 26–27 de septiembre. */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(resolve(__dirname, "../.env.local"), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      const key = l.slice(0, i);
      let value = l.slice(i + 1);
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      return [key, value];
    }),
);

const sb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);

const SLUG = "fecha-7-reprogramacion-2026";
const FILENAME = "fecha-7-reprogramacion.jpg";
const CACHE_BUST = "v=20260902";
const CIRCUIT = "Kartódromo Internacional de Zárate";
const BODY = [
  "🏁 ROUND #7 – ÚLTIMA FECHA DE LA ETAPA REGULAR",
  "",
  "La Fecha 7 de IAME Series Argentina se reprogramará para los días 26 y 27 de septiembre en el Kartódromo Ciudad de Zárate.",
  "",
  "Durante el mismo evento, y en paralelo a los puntajes correspondientes al Campeonato 2026, se disputará el sistema de puntos especial ROAD TO VITERBO, que definirá los cupos para la IAME World Final o, en su defecto, los premios alternativos establecidos para esta competencia.",
  "",
  "Además, se disputará en paralelo el IAME PASS 2027, destinado a pilotos que hayan participado en no más de dos fechas durante la temporada 2026, como también a aquellos pilotos que nunca hayan competido en IAME Series Argentina.",
  "",
  "Próximamente estaremos brindando toda la información sobre el formato deportivo, sistema de puntos y condiciones de cada premio.",
  "",
  "Muchas gracias.",
].join("\n");
const FLYER_COPY = [
  "REPROGRAMACIÓN",
  "Round #7 | Última fecha etapa regular",
  "26 y 27 de septiembre",
  CIRCUIT,
  "",
  "En esta misma fecha se entregarán los cupos para ir a Viterbo y los IAME PASS 2027.",
].join("\n");

const filePath = resolve(__dirname, "../public/noticias", FILENAME);
const storagePath = `noticias/${FILENAME}`;

const { error: uploadErr } = await sb.storage.from("event-media").upload(
  storagePath,
  readFileSync(filePath),
  {
    contentType: "image/jpeg",
    cacheControl: "3600",
    upsert: true,
  },
);

if (uploadErr) {
  console.error("Error subiendo el flyer:", uploadErr.message);
  process.exit(1);
}

const imageUrl = `${sb.storage.from("event-media").getPublicUrl(storagePath).data.publicUrl}?${CACHE_BUST}`;

const { data: season, error: seasonErr } = await sb
  .from("seasons")
  .select("id")
  .eq("is_active", true)
  .maybeSingle();

if (seasonErr || !season) {
  console.error("No se encontró temporada activa:", seasonErr?.message);
  process.exit(1);
}

const { data: round, error: roundErr } = await sb
  .from("rounds")
  .update({
    event_date: "2026-09-26",
    event_date_iso: null,
    circuit: CIRCUIT,
    location: CIRCUIT,
    city: "Zárate",
    flyer_url: imageUrl,
    status: "upcoming",
  })
  .eq("season_id", season.id)
  .eq("round_number", 7)
  .select("id, name, round_number, event_date, circuit, city, flyer_url, status")
  .maybeSingle();

if (roundErr) {
  console.error("Error actualizando Fecha 7:", roundErr.message);
  process.exit(1);
}

const { data: flyerRow, error: flyerReadErr } = await sb
  .from("app_config")
  .select("value")
  .eq("key", "flyer_copy")
  .maybeSingle();

if (flyerReadErr) {
  console.error("Error leyendo flyer_copy:", flyerReadErr.message);
  process.exit(1);
}

const flyerCopy =
  flyerRow?.value && typeof flyerRow.value === "object" && !Array.isArray(flyerRow.value)
    ? { ...flyerRow.value }
    : {};
flyerCopy["7"] = FLYER_COPY;

const { error: flyerWriteErr } = await sb.from("app_config").upsert(
  { key: "flyer_copy", value: flyerCopy, updated_at: new Date().toISOString() },
  { onConflict: "key" },
);

if (flyerWriteErr) {
  console.error("Error guardando flyer_copy:", flyerWriteErr.message);
  process.exit(1);
}

const { data: news, error: newsErr } = await sb
  .from("news")
  .upsert(
    {
      slug: SLUG,
      title: "REPROGRAMACIÓN — FECHA 7",
      excerpt:
        "Round #7, última fecha de la etapa regular. 26 y 27 de septiembre, Kartódromo Ciudad de Zárate. Road to Viterbo e IAME PASS 2027.",
      body: BODY,
      category: "Campeonato 2026",
      image_url: imageUrl,
      is_published: true,
      list_in_feed: true,
      show_inscription_cta: true,
      sort_order: 0,
      published_at: new Date().toISOString(),
    },
    { onConflict: "slug" },
  )
  .select("slug, title, image_url, is_published")
  .maybeSingle();

if (newsErr) {
  console.error("Error publicando la noticia:", newsErr.message);
  process.exit(1);
}

console.log("Round:", round);
console.log("News:", news);
console.log("Image:", imageUrl);
