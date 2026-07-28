/** Compresión client-side para uploads de inscripción (evita límites de body en Vercel). */

const MAX_EDGE = 1600;
const TARGET_MAX_BYTES = 1.2 * 1024 * 1024;
const OUTPUT_TYPE = "image/jpeg";

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error(
          "No se pudo leer la imagen. Usá JPG, PNG o WebP (en iPhone: “Más compatibles” o “Más grande”).",
        ),
      );
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo comprimir la imagen."));
          return;
        }
        resolve(blob);
      },
      OUTPUT_TYPE,
      quality,
    );
  });
}

/**
 * Redimensiona y convierte a JPEG liviano.
 * Evita que 2 fotos de celular (>2–3 MB c/u) superen el límite de body de Vercel (~4.5 MB).
 */
export async function compressImageForUpload(file: File): Promise<File> {
  if (!file || file.size === 0) {
    throw new Error("La foto está vacía.");
  }

  const lower = file.name.toLowerCase();
  const looksHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    lower.endsWith(".heic") ||
    lower.endsWith(".heif");

  // Si ya es chica y JPEG/PNG/WebP, no tocar.
  if (
    !looksHeic &&
    file.size <= TARGET_MAX_BYTES &&
    (file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/webp")
  ) {
    return file;
  }

  const img = await loadImage(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo preparar la imagen.");
  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.82;
  let blob = await canvasToBlob(canvas, quality);
  while (blob.size > TARGET_MAX_BYTES && quality > 0.45) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, quality);
  }

  if (blob.size > 3 * 1024 * 1024) {
    throw new Error(
      "La foto sigue siendo muy pesada. Probá otra más chica (máx. 3 MB).",
    );
  }

  const base = file.name.replace(/\.[^.]+$/, "") || "foto";
  return new File([blob], `${base}.jpg`, {
    type: OUTPUT_TYPE,
    lastModified: Date.now(),
  });
}
