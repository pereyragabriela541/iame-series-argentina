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

const regulations = [
  {
    title: "Reglamento Argentino de Karting Año 2026",
    doc_type: "general",
    pdf_url: "/reglamentos/reglamento-argentino-karting-2026.pdf",
    sort_order: 1,
    is_published: true,
  },
  {
    title: "Reglamento Deportivo BS Proyect 2026",
    doc_type: "deportivo",
    pdf_url: "/reglamentos/reglamento-deportivo-bs-proyect-2026.pdf",
    sort_order: 2,
    is_published: true,
  },
  {
    title: "Reglamento Técnico 60 Under / 60 Mini 2026",
    doc_type: "tecnico",
    pdf_url: "/reglamentos/reglamento-tecnico-60-under-60-mini-2026.pdf",
    sort_order: 3,
    is_published: true,
  },
  {
    title: "Reglamento Técnico Old School Junior 2026",
    doc_type: "tecnico",
    pdf_url: "/reglamentos/reglamento-tecnico-old-school-junior-2026.pdf",
    sort_order: 4,
    is_published: true,
  },
  {
    title: "Reglamento Técnico Old School Senior 2026",
    doc_type: "tecnico",
    pdf_url: "/reglamentos/reglamento-tecnico-old-school-senior-2026.pdf",
    sort_order: 5,
    is_published: true,
  },
  {
    title: "Reglamento Técnico Honda Senior Pro 390 2026",
    doc_type: "tecnico",
    pdf_url: "/reglamentos/reglamento-tecnico-honda-senior-pro-390-2026.pdf",
    sort_order: 6,
    is_published: true,
  },
  {
    title: "Reglamento Técnico Old School Master / Gentleman 2026",
    doc_type: "tecnico",
    pdf_url: "/reglamentos/reglamento-tecnico-old-school-master-gentleman-2026.pdf",
    sort_order: 7,
    is_published: true,
  },
];

const { error: delError } = await sb.from("regulations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
if (delError) {
  console.error("Error al limpiar regulations:", delError.message);
  process.exit(1);
}

const { data, error } = await sb.from("regulations").insert(regulations).select();
if (error) {
  console.error("Error al insertar:", error.message);
  process.exit(1);
}

console.log(`Cargados ${data.length} reglamentos en Supabase.`);
