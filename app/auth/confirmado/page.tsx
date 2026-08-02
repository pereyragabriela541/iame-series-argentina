import { Suspense } from "react";

import AuthConfirmadoClient from "./ConfirmadoClient";

export default function AuthConfirmadoPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-6 py-16 text-center">
          <p className="text-sm text-neutral-400">Confirmando…</p>
        </main>
      }
    >
      <AuthConfirmadoClient />
    </Suspense>
  );
}
