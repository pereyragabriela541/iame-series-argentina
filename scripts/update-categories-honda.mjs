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

const updates = [
  {
    slug: "academy",
    name: "ACADEMY/HONDA",
    short_name: "ACADH",
    sort_order: 10,
    color: "#75BEE9",
    is_active: true,
  },
  {
    slug: "senior-pro-390-honda",
    name: "SENIOR 390 PRO/HONDA",
    short_name: "S390H",
    sort_order: 9,
    color: "#E30613",
    is_active: true,
  },
];

for (const cat of updates) {
  const { slug, ...fields } = cat;
  const { error } = await sb.from("categories").update(fields).eq("slug", slug);
  if (error) {
    console.error(`Error actualizando ${slug}:`, error.message);
    process.exit(1);
  }
  console.log(`OK: ${slug} → ${fields.name}`);
}
