import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createSupabaseServer } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const origin = SITE_URL.replace(/\/$/, "");

  const supabase = createSupabaseServer();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/auth/confirmado`);
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}/auth/confirmado`);
    }
  }

  // Importante:
  // Algunos links de Supabase llegan con los tokens en el fragmento (#...),
  // que NO se envía al servidor (no aparece en request.url/searchParams).
  // En ese caso, Supabase ya hizo la verificación y solo necesitamos mostrar
  // la confirmación al usuario.
  return NextResponse.redirect(`${origin}/auth/confirmado`);
}
