import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { DbSetupBanner, EmptyState, PdfLink } from "@/components/ui";
import { formatRoundEventDates, getRoundKicker } from "@/lib/calendar-dates";
import {
  getCategories,
  getRoundById,
  getRoundResults,
} from "@/lib/queries";
import { getRoundFlyerBlurb } from "@/lib/round-flyers";
import { groupRoundResultsByCategory } from "@/lib/round-results-order";
import type { Category, RoundResult } from "@/lib/types";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const round = await getRoundById(id).catch(() => null);
  return { title: round ? `${round.name} | IAME` : "Fecha" };
}

export default async function RoundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let round = null;
  let results: RoundResult[] = [];
  let categories: Category[] = [];

  try {
    [round, results, categories] = await Promise.all([
      getRoundById(id),
      getRoundResults(id),
      getCategories(),
    ]);
  } catch {
    return (
      <div className="space-y-6">
        <DbSetupBanner />
      </div>
    );
  }

  if (!round) notFound();

  const groupedResults = groupRoundResultsByCategory(results, categories);
  const flyerBlurb = getRoundFlyerBlurb(round.round_number);

  return (
    <div className="space-y-6">
      <Link href="/calendario" className="text-[10px] font-semibold uppercase tracking-widest text-iame-red hover:underline">
        ← Calendario
      </Link>
      <PageHeader
        kicker={getRoundKicker(round.round_number)}
        title={round.name}
        subtitle={`${round.circuit ?? ""} · ${formatRoundEventDates(round)}`}
      />

      {round.flyer_url ? (
        <article className="border border-neutral-800 bg-neutral-900/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={round.flyer_url}
            alt={`Flyer ${round.name}`}
            className="mx-auto block w-full max-w-xl bg-neutral-950 object-contain"
          />
          {flyerBlurb ? (
            <div className="space-y-4 border-t border-neutral-800 bg-neutral-900/40 px-5 py-5 sm:px-6">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-300 sm:text-base">
                {flyerBlurb}
              </p>
              <Link
                href="/inscripcion"
                className="inline-block bg-iame-red px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-iame-red/90"
              >
                Inscribite ahora
              </Link>
            </div>
          ) : null}
        </article>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {round.map_url && (
          <a href={round.map_url} target="_blank" rel="noopener noreferrer" className="border border-neutral-800 px-4 py-3 text-sm text-iame-sky hover:border-iame-sky">
            Ver mapa del circuito
          </a>
        )}
        {round.map_pdf_url && <PdfLink href={round.map_pdf_url} label="Mapa PDF" />}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-white">Resultados</h2>
        {results.length ? (
          <div className="space-y-4">
            {groupedResults.map(({ category, results: categoryResults }) => (
              <div key={category.id} className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  {category.name}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {categoryResults.map((result) => (
                    <PdfLink
                      key={result.id}
                      href={result.pdf_url}
                      label={result.label}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="Sin PDFs de resultados para esta fecha." />
        )}
      </section>
    </div>
  );
}
