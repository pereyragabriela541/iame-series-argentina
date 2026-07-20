import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");

const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const sb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const fecha4 = JSON.parse(
  readFileSync(resolve(__dirname, "../supabase/seed-standings-fecha4-2026.json"), "utf8")
);
const extra = JSON.parse(
  readFileSync(resolve(__dirname, "../supabase/seed-standings-extra-2026.json"), "utf8")
);

const categories = { ...fecha4.categories, ...extra.categories };

const { data: season, error: seasonErr } = await sb
  .from("seasons")
  .select("id")
  .eq("year", 2026)
  .single();

if (seasonErr || !season) {
  console.error("No se encontró la temporada 2026:", seasonErr?.message);
  process.exit(1);
}

const { data: cats, error: catErr } = await sb
  .from("categories")
  .select("id, slug")
  .eq("is_active", true);

if (catErr || !cats?.length) {
  console.error("No se pudieron cargar categorías:", catErr?.message);
  process.exit(1);
}

const catBySlug = Object.fromEntries(cats.map((c) => [c.slug, c.id]));

const { error: delErr } = await sb
  .from("standings")
  .delete()
  .eq("season_id", season.id);

if (delErr) {
  console.error("Error al limpiar standings:", delErr.message);
  process.exit(1);
}

const rows = [];

for (const [slug, pilots] of Object.entries(categories)) {
  const categoryId = catBySlug[slug];
  if (!categoryId) {
    console.warn(`Categoría omitida: ${slug}`);
    continue;
  }

  for (const entry of pilots) {
    const [position, pilot_name, points, number, wins] = entry;
    rows.push({
      season_id: season.id,
      category_id: categoryId,
      pilot_number: number ? String(number) : String(position).padStart(2, "0"),
      pilot_name,
      nationality: "ARG",
      points,
      position,
      wins: wins ?? (position === 1 ? 1 : 0),
      clasif: 0,
      m1: 0,
      m2: 0,
      sh: 0,
      final_pts: 0,
    });
  }
}

const { error } = await sb.from("standings").insert(rows);
if (error) {
  console.error("Error al insertar:", error.message);
  process.exit(1);
}

console.log(`Cargados ${rows.length} pilotos en total.`);
for (const [slug, pilots] of Object.entries(categories)) {
  if (catBySlug[slug]) console.log(`  ${slug}: ${pilots.length}`);
}
console.log("  academy: 0 (sin tabla en el PDF)");
