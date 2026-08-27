import { NextResponse } from "next/server";
import { getDuosForRound } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Dúos públicos (sin DNI/email) para web y app. round_key viene de Supabase. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ roundKey: string }> },
) {
  try {
    const { roundKey } = await context.params;
    const duos = await getDuosForRound(decodeURIComponent(roundKey));
    return NextResponse.json({ duos });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
