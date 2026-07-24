import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
const seedPath = resolve(__dirname, "../supabase/seed-standings-extra-2026.json");

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

const seed = JSON.parse(readFileSync(seedPath, "utf8"));

const { data: season, error: seasonErr } = await sb
  .from("seasons")
  .select("id")
  .eq("year", 2026)
  .single();

if (seasonErr || !season) {
  console.error("No se encontró la temporada 2026:", seasonErr?.message);
  process.exit(1);
}

const slugs = Object.keys(seed.categories);
const { data: categories, error: catErr } = await sb
  .from("categories")
  .select("id, slug")
  .in("slug", [...slugs, "academy"]);

if (catErr) {
  console.error("No se pudieron cargar categorías:", catErr.message);
  process.exit(1);
}

const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

for (const slug of slugs) {
  const categoryId = catBySlug[slug];
  if (!categoryId) {
    console.warn(`Categoría omitida (no existe en DB): ${slug}`);
    continue;
  }

  const { error: delErr } = await sb
    .from("standings")
    .delete()
    .eq("season_id", season.id)
    .eq("category_id", categoryId);

  if (delErr) {
    console.error(`Error al limpiar ${slug}:`, delErr.message);
    process.exit(1);
  }

  const pilots = seed.categories[slug];
  if (!pilots.length) continue;

  const rows = pilots.map((entry) => {
    const [position, pilot_name, points, number, wins, presentismo] = entry;
    return {
      season_id: season.id,
      category_id: categoryId,
      pilot_number: number ? String(number) : String(position).padStart(2, "0"),
      pilot_name,
      nationality: "ARG",
      points,
      position,
      wins: wins ?? (position === 1 ? 1 : 0),
      presentismo: presentismo ?? 0,
      clasif: 0,
      m1: 0,
      m2: 0,
      sh: 0,
      final_pts: 0,
    };
  });

  const { error } = await sb.from("standings").insert(rows);
  if (error) {
    console.error(`Error al insertar ${slug}:`, error.message);
    process.exit(1);
  }

  console.log(`${slug}: ${rows.length} pilotos`);
}

if (catBySlug.academy) {
  console.log("academy: sin datos en el PDF (pestaña visible, tabla vacía)");
}

console.log("Listo — las 6 categorías de ayer no se tocaron.");
