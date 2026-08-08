import { extractText, getDocumentProxy, getMeta } from "unpdf";

export interface ExtractedPdfContent {
  text: string;
  title: string | null;
  pageCount: number;
}

function toUint8Array(data: ArrayBuffer | Uint8Array | Buffer): Uint8Array {
  if (data instanceof Uint8Array && !Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  return Uint8Array.from(data);
}

/** Extrae texto y metadata de un PDF (sin OCR). */
export async function extractPdfContent(
  data: ArrayBuffer | Uint8Array | Buffer,
): Promise<ExtractedPdfContent> {
  const pdf = await getDocumentProxy(toUint8Array(data));
  const [{ text, totalPages }, meta] = await Promise.all([
    extractText(pdf, { mergePages: true }),
    getMeta(pdf),
  ]);

  const title =
    typeof meta?.info?.Title === "string" ? meta.info.Title : null;

  const rawText = text as string | string[];
  return {
    text: Array.isArray(rawText) ? rawText.join("\n") : (rawText ?? ""),
    title,
    pageCount: totalPages ?? 0,
  };
}
