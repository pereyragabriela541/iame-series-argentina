import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { DbSetupBanner } from "@/components/ui";
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

  return (
    <div className="space-y-6">
      <Link
        href="/calendario"
        className="text-[10px] font-semibold uppercase tracking-widest text-iame-red hover:underline"
      >
        ← Calendario
      </Link>
      <PageHeader title={round.name} />
    </div>
  );
}
