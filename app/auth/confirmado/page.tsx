import { BRAND } from "@/lib/branding";

export default async function AuthConfirmadoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const ok = error !== "1";

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-6 py-16 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-iame-sky">
        {BRAND.name}
      </p>
      <h1 className="mt-4 text-2xl font-bold uppercase text-white">
        {ok ? "Email confirmado" : "No se pudo confirmar"}
      </h1>
      {!ok ? (
        <p className="mt-4 text-sm leading-relaxed text-neutral-400">
          El enlace puede haber vencido. Volvé a la app, creá la cuenta de nuevo
          o pedí un nuevo mail de confirmación.
        </p>
      ) : null}
    </main>
  );
}
