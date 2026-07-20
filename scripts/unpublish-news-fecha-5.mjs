#!/usr/bin/env node
/** Despublica la noticia flyer Fecha 5 (slug: fecha-5). */
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

const { data, error } = await sb
  .from("news")
  .update({ is_published: false })
  .eq("slug", "fecha-5")
  .select("slug, title, is_published");

if (error) {
  console.error(error.message);
  process.exit(1);
}
console.log("OK:", data);
