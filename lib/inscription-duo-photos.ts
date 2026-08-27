import { createSupabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "inscription-duos";
const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function mimeFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "";
}

function resolveMime(file: File): string {
  const raw = (file.type || "").toLowerCase().trim();
  if (raw === "image/jpg") return "image/jpeg";
  if (ALLOWED.has(raw)) return raw;
  return mimeFromName(file.name);
}

function extFor(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export async function uploadDuoPhoto(opts: {
  file: File;
  registrationKey: string;
  role: "titular" | "invitado";
  roundKey: string;
}): Promise<string> {
  const { file, registrationKey, role, roundKey } = opts;
  const mime = resolveMime(file);
  if (!mime || !ALLOWED.has(mime)) {
    throw new Error("Formato de foto inválido. Usá JPG, PNG o WebP.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("La foto supera el máximo de 3 MB.");
  }

  const folder = String(roundKey || "duos").trim() || "duos";

  // Best-effort: limpia otra extensión del mismo rol (png vs jpg).
  await deleteDuoPhoto({ registrationKey, role, roundKey: folder }).catch(
    () => undefined,
  );

  const sb = createSupabaseAdmin();
  const path = `${folder}/${registrationKey}/${role}.${extFor(mime)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await sb.storage.from(BUCKET).upload(path, buffer, {
    contentType: mime,
    upsert: true,
  });
  if (error) throw new Error(`No se pudo subir la foto (${role}): ${error.message}`);

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function deleteDuoPhoto(opts: {
  registrationKey: string;
  role: "titular" | "invitado";
  roundKey: string;
}): Promise<void> {
  const sb = createSupabaseAdmin();
  const folder = `${String(opts.roundKey || "duos").trim() || "duos"}/${opts.registrationKey}`;
  const { data, error } = await sb.storage.from(BUCKET).list(folder);
  // Carpeta inexistente / vacía: no bloquear el alta.
  if (error) return;

  const paths = (data ?? [])
    .filter((f) => f.name.startsWith(`${opts.role}.`))
    .map((f) => `${folder}/${f.name}`);

  if (!paths.length) return;

  const { error: removeError } = await sb.storage.from(BUCKET).remove(paths);
  if (removeError) {
    console.warn("[duo-photos] remove:", removeError.message);
  }
}
