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

  await deleteDuoPhoto({ registrationKey, role });

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

export async function deleteDuoPhoto(opts: {
  registrationKey: string;
  role: "titular" | "invitado";
}): Promise<void> {
  const sb = createSupabaseAdmin();
  const folder = `fecha-6/${opts.registrationKey}`;
  const { data, error } = await sb.storage.from(BUCKET).list(folder);
  if (error) throw new Error(error.message);

  const paths = (data ?? [])
    .filter((f) => f.name.startsWith(`${opts.role}.`))
    .map((f) => `${folder}/${f.name}`);

  if (!paths.length) return;

  const { error: removeError } = await sb.storage.from(BUCKET).remove(paths);
  if (removeError) throw new Error(removeError.message);
}
