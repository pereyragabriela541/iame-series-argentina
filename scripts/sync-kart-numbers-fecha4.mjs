#!/usr/bin/env node
/**
 * Sincroniza pilot_number en standings con el Excel de inscriptos Fecha 4.
 * Uso: node scripts/sync-kart-numbers-fecha4.mjs "/path/to/SOLO INSCRIPTOS FECHA 4 2026.xlsx"
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const xlsxPath = process.argv[2];
if (!xlsxPath) {
  console.error("Uso: node scripts/sync-kart-numbers-fecha4.mjs <ruta.xlsx>");
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
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

const SHEET_TO_SLUG = {
  MINI: "60-mini",
  "OKN JUNIOR": "okn-junior",
  OKN: "okn",
  "JUNIOR OLD": "junior",
  "SENIOR OLD": "senior",
  "MASTER OLD": "master-gentleman",
  "HONDA 390": "senior-pro-390-honda",
  ACADEMY: "academy",
};

function normName(s) {
  if (!s) return "";
  return String(s)
    .toUpperCase()
    .replace(/,/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseExcel(path) {
  const py = join(__dirname, "parse-inscriptos-xlsx.py");
  const raw = execSync(`python3 "${py}" "${path}"`, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  return JSON.parse(raw);
}

function nameTokens(name) {
  return normName(name).split(" ").filter(Boolean);
}

function namesMatch(a, b) {
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (!ta.length || !tb.length) return false;
  const lastA = ta[0];
  const lastB = tb[0];
  const firstA = ta.slice(1).join(" ");
  const firstB = tb.slice(1).join(" ");
  if (lastA !== lastB) return false;
  if (!firstA || !firstB) return true;
  return firstA.startsWith(firstB.slice(0, 3)) || firstB.startsWith(firstA.slice(0, 3)) || firstA === firstB;
}

const excelPilots = parseExcel(xlsxPath);
console.log(`Excel: ${excelPilots.length} pilotos con kart`);

const { data: season } = await sb
  .from("seasons")
  .select("id")
  .eq("is_active", true)
  .maybeSingle();
if (!season) throw new Error("No hay temporada activa");

const { data: categories } = await sb.from("categories").select("id, slug, name");

const catBySlug = Object.fromEntries((categories ?? []).map((c) => [c.slug, c]));

const { data: standings } = await sb
  .from("standings")
  .select("id, pilot_name, pilot_number, nationality, category_id, categories(slug)")
  .eq("season_id", season.id);

let updated = 0;
let skipped = 0;
const notFound = [];

for (const row of excelPilots) {
  const cat = catBySlug[row.slug];
  if (!cat) {
    console.warn(`Categoría no mapeada: ${row.sheet} -> ${row.slug}`);
    continue;
  }

  const candidates = (standings ?? []).filter(
    (s) => s.categories?.slug === row.slug && namesMatch(s.pilot_name, row.name)
  );

  if (candidates.length === 0) {
    notFound.push(row);
    continue;
  }

  const match = candidates[0];
  if (String(match.pilot_number) === row.kart) {
    skipped++;
    continue;
  }

  const { error } = await sb
    .from("standings")
    .update({ pilot_number: row.kart })
    .eq("id", match.id);

  if (error) {
    console.error("Error", row.name, error.message);
    continue;
  }

  console.log(
    `✓ [${row.slug}] ${match.pilot_name} -> kart ${match.pilot_number} => ${row.kart}`
  );
  updated++;
}

console.log(`\nActualizados: ${updated}, ya correctos: ${skipped}, sin match: ${notFound.length}`);
if (notFound.length) {
  console.log("\nSin match en standings:");
  for (const n of notFound.slice(0, 30)) {
    console.log(`  - [${n.slug}] ${n.name} (#${n.kart})`);
  }
  if (notFound.length > 30) console.log(`  ... y ${notFound.length - 30} más`);
}
