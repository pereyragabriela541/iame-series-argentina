#!/usr/bin/env node
/** Oculta el flyer/PDF de la Final IAME y deja la fecha a confirmar. */
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

const SLUGS = [
  "final-iame-argentina-2026",
  "inscripciones-abiertas-final-iame-2026",
];

const { data: news, error: newsErr } = await sb
  .from("news")
  .update({ is_published: false })
  .in("slug", SLUGS)
  .select("slug, title, is_published");

if (newsErr) {
  console.error("Error despublicando noticias:", newsErr.message);
  process.exit(1);
}

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
    flyer_url: null,
    event_date: null,
    event_date_iso: null,
  })
  .eq("season_id", season.id)
  .eq("round_number", 11)
  .select("id, name, event_date, event_date_iso, flyer_url")
  .maybeSingle();

if (roundErr) {
  console.error("Error actualizando la Final:", roundErr.message);
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
delete flyerCopy["11"];

const { error: flyerWriteErr } = await sb.from("app_config").upsert(
  { key: "flyer_copy", value: flyerCopy, updated_at: new Date().toISOString() },
  { onConflict: "key" },
);

if (flyerWriteErr) {
  console.error("Error guardando flyer_copy:", flyerWriteErr.message);
  process.exit(1);
}

console.log("News:", news);
console.log("Round:", round);
console.log("flyer_copy keys:", Object.keys(flyerCopy));
