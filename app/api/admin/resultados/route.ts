import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import {
  unauthorizedResponse,
  verifyAdminExportToken,
} from "@/lib/admin-export";
import { computeResultSortOrder } from "@/lib/round-results-order";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BUCKET = "resultados";
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function ensureBucket() {
  const sb = createSupabaseAdmin();
  const { data } = await sb.storage.getBucket(BUCKET);
  if (data) return;

  const { error } = await sb.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_FILE_SIZE,
    allowedMimeTypes: ["application/pdf"],
  });
  if (error && !error.message.toLowerCase().includes("already exists")) {
    throw new Error(error.message);
  }
}

async function validateRoundAndCategory(roundId: string, categoryId: string) {
  if (!UUID_RE.test(roundId) || !UUID_RE.test(categoryId)) {
    throw new Error("Fecha o categoría inválida");
  }

  const sb = createSupabaseAdmin();
  const [{ data: round }, { data: category }] = await Promise.all([
    sb.from("rounds").select("id").eq("id", roundId).maybeSingle(),
    sb
      .from("categories")
      .select("id, sort_order")
      .eq("id", categoryId)
      .maybeSingle(),
  ]);

  if (!round || !category) throw new Error("Fecha o categoría inexistente");
  return category;
}

export async function GET(request: Request) {
  if (!verifyAdminExportToken(request)) return unauthorizedResponse();

  try {
    const sb = createSupabaseAdmin();
    const { data: season, error: seasonError } = await sb
      .from("seasons")
      .select("id")
      .eq("is_active", true)
      .single();
    if (seasonError) throw seasonError;

    const [{ data: rounds, error: roundsError }, { data: categories, error: categoriesError }] =
      await Promise.all([
        sb
          .from("rounds")
          .select("id, round_number, name, status, sort_order")
          .eq("season_id", season.id)
          .order("sort_order"),
        sb
          .from("categories")
          .select("id, name, sort_order")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
      ]);
    if (roundsError) throw roundsError;
    if (categoriesError) throw categoriesError;

    const roundIds = (rounds ?? []).map((round) => round.id);
    const { data: results, error: resultsError } = roundIds.length
      ? await sb
          .from("round_results")
          .select("id, round_id, category_id, label, pdf_url, sort_order")
          .in("round_id", roundIds)
          .order("sort_order")
      : { data: [], error: null };
    if (resultsError) throw resultsError;

    return NextResponse.json({
      rounds: rounds ?? [],
      categories: categories ?? [],
      results: results ?? [],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudieron cargar los datos";
    return errorResponse(message, 500);
  }
}

export async function POST(request: Request) {
  if (!verifyAdminExportToken(request)) return unauthorizedResponse();

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? "");
    const roundId = String(body.roundId ?? "");
    const categoryId = String(body.categoryId ?? "");

    if (action === "prepare") {
      const fileSize = Number(body.fileSize);
      if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_FILE_SIZE) {
        return errorResponse("El PDF debe pesar menos de 50 MB");
      }

      await validateRoundAndCategory(roundId, categoryId);
      await ensureBucket();

      const path = `${roundId}/${categoryId}/${Date.now()}-${randomUUID()}.pdf`;
      const sb = createSupabaseAdmin();
      const { data, error } = await sb.storage
        .from(BUCKET)
        .createSignedUploadUrl(path);
      if (error) throw error;

      return NextResponse.json({ path, token: data.token });
    }

    if (action === "complete") {
      const label = String(body.label ?? "").trim().slice(0, 100);
      const path = String(body.path ?? "");
      const expectedPrefix = `${roundId}/${categoryId}/`;
      if (!label) return errorResponse("Escribí un nombre para el resultado");
      if (!path.startsWith(expectedPrefix) || !path.endsWith(".pdf")) {
        return errorResponse("La ruta del archivo es inválida");
      }

      const category = await validateRoundAndCategory(roundId, categoryId);
      const sb = createSupabaseAdmin();
      const slash = path.lastIndexOf("/");
      const folder = path.slice(0, slash);
      const filename = path.slice(slash + 1);
      const { data: files, error: listError } = await sb.storage
        .from(BUCKET)
        .list(folder, { search: filename, limit: 10 });
      if (listError) throw listError;
      if (!files?.some((file) => file.name === filename)) {
        return errorResponse("El PDF no terminó de subirse", 409);
      }

      const { data: publicData } = sb.storage.from(BUCKET).getPublicUrl(path);
      const { data: result, error } = await sb
        .from("round_results")
        .insert({
          round_id: roundId,
          category_id: categoryId,
          label,
          pdf_url: publicData.publicUrl,
          sort_order: computeResultSortOrder(category.sort_order, label),
        })
        .select("id, round_id, category_id, label, pdf_url, sort_order")
        .single();
      if (error) throw error;

      return NextResponse.json({ result });
    }

    return errorResponse("Acción inválida");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo guardar el resultado";
    return errorResponse(message, 500);
  }
}

export async function PATCH(request: Request) {
  if (!verifyAdminExportToken(request)) return unauthorizedResponse();

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const roundId = String(body.roundId ?? "");
    if (!UUID_RE.test(roundId)) return errorResponse("Fecha inválida");

    const sb = createSupabaseAdmin();
    const { error } = await sb
      .from("rounds")
      .update({ status: "finished" })
      .eq("id", roundId);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo publicar la fecha";
    return errorResponse(message, 500);
  }
}

export async function DELETE(request: Request) {
  if (!verifyAdminExportToken(request)) return unauthorizedResponse();

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const resultId = String(body.resultId ?? "");
    if (!UUID_RE.test(resultId)) return errorResponse("Resultado inválido");

    const sb = createSupabaseAdmin();
    const { data: result, error: fetchError } = await sb
      .from("round_results")
      .select("pdf_url")
      .eq("id", resultId)
      .single();
    if (fetchError) throw fetchError;

    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const markerIndex = result.pdf_url.indexOf(marker);
    if (markerIndex >= 0) {
      const path = decodeURIComponent(
        result.pdf_url.slice(markerIndex + marker.length).split("?")[0],
      );
      await sb.storage.from(BUCKET).remove([path]);
    }

    const { error } = await sb.from("round_results").delete().eq("id", resultId);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo eliminar el resultado";
    return errorResponse(message, 500);
  }
}
