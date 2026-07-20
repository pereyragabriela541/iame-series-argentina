#!/usr/bin/env node
/**
 * Mueve PDFs de resultados de master-gentleman → master
 * para que en /resultados se vea "MASTER MY10/GENTLEMAN".
 */
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
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const sb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: cats, error: catErr } = await sb
  .from("categories")
  .select("id, slug, name")
  .in("slug", ["master", "master-gentleman"]);

if (catErr) throw catErr;

const master = cats.find((c) => c.slug === "master");
const gentleman = cats.find((c) => c.slug === "master-gentleman");
if (!master || !gentleman) {
  console.error("Faltan categorías", cats);
  process.exit(1);
}

console.log("master:", master.id, master.name);
console.log("gentleman:", gentleman.id, gentleman.name);

const { data: before, error: beforeErr } = await sb
  .from("round_results")
  .select("id, round_id, category_id, label, pdf_url")
  .eq("category_id", gentleman.id);

if (beforeErr) throw beforeErr;
console.log("PDFs bajo gentleman:", before?.length ?? 0);
for (const r of before ?? []) {
  console.log(" -", r.label, r.id);
}

const dry = process.argv.includes("--dry");
if (dry) {
  console.log("DRY RUN — no update");
  process.exit(0);
}

if (!before?.length) {
  console.log("Nada que mover");
  process.exit(0);
}

const { data: updated, error: updErr } = await sb
  .from("round_results")
  .update({ category_id: master.id })
  .eq("category_id", gentleman.id)
  .select("id, label");

if (updErr) throw updErr;
console.log("OK movidos a master:", updated?.length);
