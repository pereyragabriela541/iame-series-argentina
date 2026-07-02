import PageHeader from "@/components/PageHeader";
import { DbSetupBanner, EmptyState, PdfLink } from "@/components/ui";
import type { Regulation } from "@/lib/types";
import { getRegulations } from "@/lib/queries";

export const metadata = { title: "Reglamentos | IAME Series Argentina" };

export default async function ReglamentosPage() {
  let regulations: Regulation[] = [];
  let dbReady = true;
  try {
    regulations = await getRegulations();
  } catch {
    dbReady = false;
  }

  return (
    <div className="space-y-6">
      {!dbReady && <DbSetupBanner />}
      <PageHeader kicker="Oficial" title="Reglamentos" subtitle="Documentación deportiva y técnica 2026" />
      {regulations.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {regulations.map((r) => (
            <PdfLink key={r.id} href={r.pdf_url} label={r.title} />
          ))}
        </div>
      ) : (
        <EmptyState message="Cargá reglamentos en Supabase → tabla regulations." />
      )}
    </div>
  );
}
