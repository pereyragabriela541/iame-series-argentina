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
    // .env.local is optional when the variables are provided by the environment.
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

const galleries = [
  {
    roundNumber: 4,
    title: "FECHA 4",
    subtitle: "Kartódromo Internacional de Zárate",
    images: [
      "/galeria/fecha-4/fecha-4-01-peloton.jpg",
      "/galeria/fecha-4/fecha-4-02-curva.jpg",
      "/galeria/fecha-4/fecha-4-03-humo.jpg",
    ],
  },
  {
    roundNumber: 5,
    title: "FECHA 5",
    subtitle: "Kartódromo de la Ciudad de Buenos Aires",
    images: [
      "/galeria/fecha-5/fecha-5-01-peloton.jpg",
      "/galeria/fecha-5/fecha-5-02-ciudad.jpg",
      "/galeria/fecha-5/fecha-5-03-duelo.jpg",
    ],
  },
  {
    roundNumber: 6,
    title: "FECHA 6",
    subtitle: "Kartódromo Ramiro Tot — Baradero",
    images: [
      "/galeria/fecha-6/fecha-6-01-largada.jpg",
      "/galeria/fecha-6/fecha-6-02-peloton.jpg",
      "/galeria/fecha-6/fecha-6-03-identidad.jpg",
    ],
  },
];

const oldImages = [
  ...Array.from({ length: 17 }, (_, index) => `/galeria/fecha-4/IMG_${7821 + index}.png`),
  ...Array.from({ length: 8 }, (_, index) => `/galeria/fecha-5/IMG_${8337 + index}.png`),
];

const { data: season, error: seasonError } = await sb
  .from("seasons")
  .select("id")
  .eq("is_active", true)
  .single();

if (seasonError || !season) {
  console.error("No se encontró la temporada activa:", seasonError?.message);
  process.exit(1);
}

const { data: rounds, error: roundsError } = await sb
  .from("rounds")
  .select("id, round_number, name")
  .eq("season_id", season.id)
  .in("round_number", galleries.map((gallery) => gallery.roundNumber));

if (roundsError) {
  console.error("No se pudieron consultar las fechas:", roundsError.message);
  process.exit(1);
}

const roundByNumber = new Map(rounds.map((round) => [round.round_number, round]));
const missingRounds = galleries.filter((gallery) => !roundByNumber.has(gallery.roundNumber));

if (missingRounds.length) {
  console.error(`No se encontraron las fechas: ${missingRounds.map((item) => item.roundNumber).join(", ")}`);
  process.exit(1);
}

const newImages = galleries.flatMap((gallery) => gallery.images);
const roundIds = galleries.map((gallery) => roundByNumber.get(gallery.roundNumber).id);

// Makes the script safe to run again without duplicating the selected images.
const { error: duplicateError } = await sb.from("media_images").delete().in("image_url", newImages);
if (duplicateError) {
  console.error("No se pudieron limpiar selecciones anteriores:", duplicateError.message);
  process.exit(1);
}

const imageRows = galleries.flatMap((gallery) => {
  const round = roundByNumber.get(gallery.roundNumber);
  return gallery.images.map((image_url, index) => ({
    title: null,
    image_url,
    round_id: round.id,
    section_key: "weekend",
    sort_order: index + 1,
    is_published: true,
  }));
});

const { data: insertedImages, error: insertError } = await sb
  .from("media_images")
  .insert(imageRows)
  .select("id, image_url");

if (insertError) {
  console.error("No se pudo publicar la nueva selección:", insertError.message);
  process.exit(1);
}

const { error: oldImagesError } = await sb.from("media_images").delete().in("image_url", oldImages);
if (oldImagesError) {
  console.error("La nueva selección se publicó, pero no se pudieron quitar las imágenes antiguas:", oldImagesError.message);
  process.exit(1);
}

const { error: oldSectionsError } = await sb
  .from("media_sections")
  .delete()
  .eq("media_type", "images")
  .in("round_id", roundIds);

if (oldSectionsError) {
  console.error("No se pudieron limpiar las secciones antiguas:", oldSectionsError.message);
  process.exit(1);
}

const sectionRows = galleries.map((gallery, index) => ({
  media_type: "images",
  round_id: roundByNumber.get(gallery.roundNumber).id,
  section_key: "weekend",
  title: gallery.title,
  subtitle: gallery.subtitle,
  description: null,
  sort_order: index + 1,
  is_published: true,
}));

const { error: sectionError } = await sb.from("media_sections").insert(sectionRows);
if (sectionError) {
  console.error("Las imágenes se actualizaron, pero no se pudieron publicar sus encabezados:", sectionError.message);
  process.exit(1);
}

console.log(`Galería actualizada: ${insertedImages.length} imágenes publicadas en las fechas 4, 5 y 6.`);
