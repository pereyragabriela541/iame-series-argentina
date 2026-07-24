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

const DESCRIPTION = `IAME Series Argentina cerró una etapa histórica en el Kartódromo de la Ciudad de Buenos Aires.

La quinta fecha de IAME Series Argentina quedó marcada como una jornada inolvidable para el karting nacional. El tradicional Kartódromo de la Ciudad de Buenos Aires recibió su última competencia oficial antes del inicio de las obras que darán paso a un nuevo trazado internacional con homologación FIA, poniendo punto final a una etapa que durante décadas fue escenario del crecimiento de miles de pilotos.

Además de la actividad en pista, la fecha tuvo un significado especial con la presentación oficial del proyecto del nuevo kartódromo, una obra que posicionará al país con un escenario de nivel internacional para el desarrollo del karting.

Master: Damián Cassino volvió a subirse en lo más alto del podio tras una gran performance dentro de la divisional mayor.

Master Gentleman: el triunfo quedó en poder de Nicolás Torres, logrando su mejor actuación en la categoría.

Junior: Santino Mateo volvió a ser imbatible en pista y acumuló una nueva victoria en la categoría; Noha Vasicek y Pedro Rossotti finalizaron segundo y tercero respectivamente.

Senior: Franco Bataglia logró finalmente la primera victoria en la temporada, tras una peleadísima última vuelta con Ricardo Mattar y Ramiro Amorelli.

OKN Junior: Ignacio Díaz Quaglia llegó finalmente a su primer podio en la temporada tras una gran actuación a lo largo de todo el fin de semana. Tomás Roca y Bruno Bisceglia terminaron segundo y tercero respectivamente.

OKN: Martín Saa se quedó con la victoria que en pista fue de Juan Ignacio Alessi, pasando a ocupar el segundo lugar, mientras que Martín Córdoba ocupó el tercer escalón del podio.

60 Mini: se encuentra en suspenso por deportiva.`;

const images = [
  "/galeria/fecha-5/IMG_8337.png",
  "/galeria/fecha-5/IMG_8338.png",
  "/galeria/fecha-5/IMG_8339.png",
  "/galeria/fecha-5/IMG_8340.png",
  "/galeria/fecha-5/IMG_8341.png",
  "/galeria/fecha-5/IMG_8342.png",
  "/galeria/fecha-5/IMG_8343.png",
  "/galeria/fecha-5/IMG_8344.png",
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
  .eq("round_number", 5)
  .single();

if (roundError || !round) {
  console.error("No se encontró Fecha 5:", roundError?.message);
  process.exit(1);
}

await sb.from("media_images").delete().like("image_url", "/galeria/fecha-5/%");
await sb
  .from("media_sections")
  .delete()
  .eq("media_type", "images")
  .eq("round_id", round.id)
  .eq("section_key", "weekend");

const { error: sectionError } = await sb.from("media_sections").insert({
  media_type: "images",
  round_id: round.id,
  section_key: "weekend",
  title: "FECHA 5",
  subtitle: "Kartódromo de la Ciudad de Buenos Aires — última fecha en el trazado histórico",
  description: DESCRIPTION,
  sort_order: 1,
  is_published: true,
});

if (sectionError) {
  console.error("Error al insertar sección:", sectionError.message);
  process.exit(1);
}

const rows = images.map((image_url, index) => ({
  title: null,
  image_url,
  round_id: round.id,
  section_key: "weekend",
  sort_order: index + 1,
  is_published: true,
}));

const { data, error } = await sb.from("media_images").insert(rows).select("id, image_url");

if (error) {
  console.error("Error al insertar imágenes:", error.message);
  process.exit(1);
}

console.log(`Insertadas ${data.length} imágenes en ${round.name} (${round.id})`);
