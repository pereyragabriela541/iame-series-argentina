import { NextResponse } from "next/server";
import { getFecha6Duos } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Dúos Fecha 6 públicos (sin DNI/email) para web y app. */
export async function GET() {
  try {
    const duos = await getFecha6Duos();
    return NextResponse.json({ duos });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
