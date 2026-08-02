import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createSupabaseServer } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next");
  const origin = SITE_URL.replace(/\/$/, "");

  // Recovery: no consumir el code en el server; la pantalla cliente lo usa
  // para abrir sesión y pedir la contraseña nueva.
  const isRecovery = type === "recovery" || next === "recovery";
  if (isRecovery) {
    const dest = new URL(`${origin}/auth/nueva-contrasena`);
    for (const key of ["code", "token_hash", "type"] as const) {
      const value = requestUrl.searchParams.get(key);
      if (value) dest.searchParams.set(key, value);
    }
    return NextResponse.redirect(dest);
  }

  // Si solo viene ?code= (sin type), no lo gastamos en el server:
  // la confirmación de email lo resuelve /auth/confirmado en cliente.
  // Nota: el reset de contraseña debe usar redirectTo=/auth/nueva-contrasena
  // (no este callback), para no confundirse con confirmación de email.
  if (code && !tokenHash && !type) {
    return NextResponse.redirect(
      `${origin}/auth/confirmado?pending=1&code=${encodeURIComponent(code)}`,
    );
  }

  const supabase = createSupabaseServer();
  let confirmed = false;
  let hadToken = false;

  if (code) {
    hadToken = true;
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) confirmed = true;
  }

  if (!confirmed && tokenHash && type) {
    hadToken = true;
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });
    if (!error) confirmed = true;
  }

  // Links con tokens en el fragmento (#...) no llegan al server: la página
  // confirmado intenta verificarlos en el cliente.
  if (!hadToken) {
    return NextResponse.redirect(`${origin}/auth/confirmado?pending=1`);
  }

  if (!confirmed) {
    return NextResponse.redirect(`${origin}/auth/confirmado?error=1`);
  }

  return NextResponse.redirect(`${origin}/auth/confirmado`);
}
