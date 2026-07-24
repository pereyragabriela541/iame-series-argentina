import { NextResponse } from "next/server";

import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Elimina la cuenta Auth del usuario autenticado y datos asociados
 * (perfil y push tokens caen por ON DELETE CASCADE; avatares se borran del storage).
 * Requerido por App Store Guideline 5.1.1(v).
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const accessToken = authHeader.slice(7).trim();
  if (!accessToken) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const admin = createSupabaseAdmin();
    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }

    const userId = user.id;

    const { data: files } = await admin.storage.from("avatars").list(userId);
    if (files && files.length > 0) {
      await admin.storage
        .from("avatars")
        .remove(files.map((f) => `${userId}/${f.name}`));
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("[account/delete]", deleteError.message);
      return NextResponse.json(
        { error: "No se pudo eliminar la cuenta. Intentá de nuevo." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[account/delete]", e);
    return NextResponse.json(
      { error: "Error al eliminar la cuenta" },
      { status: 500 },
    );
  }
}
