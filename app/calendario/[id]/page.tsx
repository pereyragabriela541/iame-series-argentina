import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { DbSetupBanner, EmptyState, PdfLink } from "@/components/ui";
import { formatRoundEventDates, getRoundKicker } from "@/lib/calendar-dates";
import {
  getCategories,
  getRoundById,
  getRoundResults,
} from "@/lib/queries";
import { resultsCategoryName } from "@/lib/results-category-labels";
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

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

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
          <div className="grid gap-2 sm:grid-cols-2">
            {results.map((r) => (
              <PdfLink
                key={r.id}
                href={r.pdf_url}
                label={`${resultsCategoryName(catMap[r.category_id]?.slug, catMap[r.category_id]?.name ?? "Categoría")} — ${r.label}`}
              />
            ))}
          </div>
        ) : (
          <EmptyState message="Sin PDFs de resultados para esta fecha." />
        )}
      </section>
    </div>
  );
}
