import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { DbSetupBanner, PdfLink } from "@/components/ui";
import { formatRoundEventDates } from "@/lib/calendar-dates";
import { getRoundById } from "@/lib/queries";
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

  try {
    round = await getRoundById(id);
  } catch {
    return (
      <div className="space-y-6">
        <DbSetupBanner />
      </div>
    );
  }

  if (!round) notFound();

  const subtitle = [round.circuit, formatRoundEventDates(round)]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6">
      <Link
        href="/calendario"
        className="text-[10px] font-semibold uppercase tracking-widest text-iame-red hover:underline"
      >
        ← Calendario
      </Link>
      <PageHeader title={round.name} subtitle={subtitle || undefined} />

      {round.map_url ? (
        <a
          href={round.map_pdf_url || round.map_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block border border-neutral-800 bg-white"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={round.map_url}
            alt={`Mapa del circuito — ${round.name}`}
            className="mx-auto block w-full max-w-3xl object-contain"
          />
        </a>
      ) : null}

      {round.map_pdf_url ? (
        <PdfLink href={round.map_pdf_url} label="Mapa del circuito (PDF)" />
      ) : null}
    </div>
  );
}
