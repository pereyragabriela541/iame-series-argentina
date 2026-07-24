import { createSupabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "inscription-duos";
const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function extFor(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export async function uploadDuoPhoto(opts: {
  file: File;
  registrationKey: string;
  role: "titular" | "invitado";
}): Promise<string> {
  const { file, registrationKey, role } = opts;
  if (!ALLOWED.has(file.type)) {
    throw new Error("Formato de foto inválido. Usá JPG, PNG o WebP.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("La foto supera el máximo de 3 MB.");
  }

  const sb = createSupabaseAdmin();
  const path = `fecha-6/${registrationKey}/${role}.${extFor(file.type)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await sb.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });
  if (error) throw new Error(error.message);

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}
