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
      const value = trimmed.slice(eq + 1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional
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

const images = [
  // Bloque 1 — Postales de los ganadores
  "/galeria/fecha-4/IMG_7821.png",
  "/galeria/fecha-4/IMG_7822.png",
  "/galeria/fecha-4/IMG_7823.png",
  "/galeria/fecha-4/IMG_7824.png",
  "/galeria/fecha-4/IMG_7825.png",
  "/galeria/fecha-4/IMG_7826.png",
  "/galeria/fecha-4/IMG_7827.png",
  // Bloque 2 — Fin de semana (después del subtítulo intermedio)
  "/galeria/fecha-4/IMG_7828.png",
  "/galeria/fecha-4/IMG_7829.png",
  "/galeria/fecha-4/IMG_7830.png",
  "/galeria/fecha-4/IMG_7831.png",
  "/galeria/fecha-4/IMG_7832.png",
  "/galeria/fecha-4/IMG_7833.png",
  "/galeria/fecha-4/IMG_7834.png",
  "/galeria/fecha-4/IMG_7835.png",
  "/galeria/fecha-4/IMG_7836.png",
  "/galeria/fecha-4/IMG_7837.png",
];

const { data: season, error: seasonError } = await sb
  .from("seasons")
  .select("id")
  .eq("is_active", true)
  .single();

if (seasonError || !season) {
  console.error("No se encontró temporada activa:", seasonError?.message);
  process.exit(1);
}

const { data: round, error: roundError } = await sb
  .from("rounds")
  .select("id, round_number, name")
  .eq("season_id", season.id)
  .eq("round_number", 4)
  .single();

if (roundError || !round) {
  console.error("No se encontró Fecha 4:", roundError?.message);
  process.exit(1);
}

await sb.from("media_images").delete().like("image_url", "/galeria/fecha-4/%");

const rows = images.map((image_url, index) => ({
  title: null,
  image_url,
  round_id: round.id,
  section_key: index < 7 ? "winners" : "weekend",
  sort_order: index + 1,
  is_published: true,
}));

const { data, error } = await sb.from("media_images").insert(rows).select("id, image_url");

if (error) {
  console.error("Error al insertar imágenes:", error.message);
  process.exit(1);
}

console.log(`Insertadas ${data.length} imágenes en ${round.name} (${round.id})`);
