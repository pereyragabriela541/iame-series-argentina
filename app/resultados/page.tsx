import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { DbSetupBanner, EmptyState, PdfLink } from "@/components/ui";
import {
  getActiveSeason,
  getCategories,
  getRoundResults,
  getRounds,
} from "@/lib/queries";

import type { Category, Round } from "@/lib/types";

export const metadata = { title: "Resultados | IAME Series Argentina" };

export default async function ResultadosPage() {
  let rounds: Round[] = [];
  let categories: Category[] = [];
  let dbReady = true;

  try {
    const season = await getActiveSeason();
    categories = await getCategories();
    if (season) rounds = await getRounds(season.id);
  } catch {
    dbReady = false;
  }

  const finishedRounds = [...rounds].reverse().filter((r) => r.status === "finished" || r.status === "live");

  return (
    <div className="space-y-8">
      {!dbReady && <DbSetupBanner />}
      <PageHeader kicker="PDF" title="Resultados" subtitle="Resultados por fecha y categoría" />

      {finishedRounds.length ? (
        await Promise.all(
          finishedRounds.map(async (round) => {
            const results = await getRoundResults(round.id).catch(() => []);
            const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
            return (
              <section key={round.id} className="space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <h2 className="text-sm font-bold uppercase text-white">{round.name}</h2>
                  <Link href={`/calendario/${round.id}`} className="text-[10px] uppercase text-iame-red hover:underline">
                    Detalle
                  </Link>
                </div>
                {results.length ? (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {results.map((r) => (
                      <PdfLink
                        key={r.id}
                        href={r.pdf_url}
                        label={`${catMap[r.category_id]?.short_name ?? "?"} — ${r.label}`}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState message="Sin resultados cargados." />
                )}
              </section>
            );
          })
        )
      ) : (
        <EmptyState message="Aún no hay fechas con resultados publicados." />
      )}
    </div>
  );
}
