import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasKey = !!(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  if (!hasUrl || !hasKey) {
    return NextResponse.json({
      ok: false,
      error: "Faltan variables de Supabase en Vercel",
      hasUrl,
      hasKey,
    });
  }

  try {
    const sb = createSupabaseServer();
    const { data: season, error: seasonErr } = await sb
      .from("seasons")
      .select("id, year")
      .eq("is_active", true)
      .single();

    if (seasonErr || !season) {
      return NextResponse.json({
        ok: false,
        error: seasonErr?.message ?? "Sin temporada activa",
      });
    }

    const { data: categories } = await sb
      .from("categories")
      .select("id, slug, name")
      .eq("is_active", true)
      .order("sort_order");

    const byCategory: Record<string, number> = {};
    let total = 0;

    for (const cat of categories ?? []) {
      const { count } = await sb
        .from("standings")
        .select("*", { count: "exact", head: true })
        .eq("season_id", season.id)
        .eq("category_id", cat.id);
      byCategory[cat.slug] = count ?? 0;
      total += count ?? 0;
    }

    return NextResponse.json({
      ok: true,
      season: season.year,
      total,
      byCategory,
      checkedAt: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : "Error desconocido",
    });
  }
}
