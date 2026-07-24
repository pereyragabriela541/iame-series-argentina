#!/usr/bin/env node
/**
 * Deploy parcial Fecha 5:
 * - Activa categorías master + gentleman separadas
 * - Reemplaza standings solo de: junior, senior, master, master-gentleman, okn, okn-junior
 *
 * Uso: node scripts/deploy-standings-fecha5-partial.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env.local");
const seedPath = resolve(root, "supabase/seed-standings-fecha5-partial-2026.json");

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
const slugs = Object.keys(seed.categories);

const { data: season, error: seasonErr } = await sb
  .from("seasons")
  .select("id")
  .eq("year", 2026)
  .single();

if (seasonErr || !season) {
  console.error("No se encontró temporada 2026:", seasonErr?.message);
  process.exit(1);
}

// Asegurar categorías master + gentleman
const categoryUpserts = [
  { slug: "master", name: "MASTER MY10", short_name: "MAS", sort_order: 5, color: "#A7A9AC", is_active: true },
  { slug: "master-gentleman", name: "GENTLEMAN", short_name: "GENT", sort_order: 6, color: "#A7A9AC", is_active: true },
  { slug: "okn-junior", name: "OKN JUNIOR", short_name: "OKNJ", sort_order: 7, color: "#E30613", is_active: true },
  { slug: "okn", name: "OKN", short_name: "OKN", sort_order: 8, color: "#E30613", is_active: true },
];

for (const cat of categoryUpserts) {
  const { error } = await sb.from("categories").upsert(cat, { onConflict: "slug" });
  if (error) {
    console.error(`Error upsert categoría ${cat.slug}:`, error.message);
    process.exit(1);
  }
}

// Reordenar OKN si hacía falta
await sb.from("categories").update({ sort_order: 7, is_active: true }).eq("slug", "okn-junior");
await sb.from("categories").update({ sort_order: 8, is_active: true }).eq("slug", "okn");
await sb.from("categories").update({ is_active: false, sort_order: 99 }).eq("slug", "master-my10");

const { data: categories, error: catErr } = await sb
  .from("categories")
  .select("id, slug")
  .in("slug", slugs);

if (catErr) {
  console.error("Error cargando categorías:", catErr.message);
  process.exit(1);
}

const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

for (const slug of slugs) {
  const categoryId = catBySlug[slug];
  if (!categoryId) {
    console.error(`Falta categoría en DB: ${slug}`);
    process.exit(1);
  }

  const { error: delErr } = await sb
    .from("standings")
    .delete()
    .eq("season_id", season.id)
    .eq("category_id", categoryId);

  if (delErr) {
    console.error(`Error limpiando ${slug}:`, delErr.message);
    process.exit(1);
  }

  const rows = seed.categories[slug].map((entry) => {
    const [position, pilot_name, points, number, wins, presentismo] = entry;
    const pilot_number =
      number && String(number).trim()
        ? String(number).trim()
        : `x${String(position).padStart(2, "0")}`;
    return {
      season_id: season.id,
      category_id: categoryId,
      pilot_number,
      pilot_name,
      nationality: "ARG",
      points,
      position,
      wins: wins ?? 0,
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
    console.error(`Error insertando ${slug}:`, error.message);
    process.exit(1);
  }

  console.log(`${slug}: ${rows.length} pilotos`);
}

console.log("\nDeploy parcial OK — junior, senior, master, gentleman, okn, okn-junior");
console.log("NO tocados: 60-mini, 60-mini-under, senior-pro-390-honda, academy");
