import PageHeader from "@/components/PageHeader";
import { DbSetupBanner, EmptyState, PdfLink } from "@/components/ui";
import type { Schedule } from "@/lib/types";
import { getSchedules } from "@/lib/queries";

export const metadata = { title: "Cronograma | IAME Series Argentina" };

export default async function CronogramaPage() {
  let schedules: Schedule[] = [];
  let dbReady = true;
  try {
    schedules = await getSchedules();
  } catch {
    dbReady = false;
  }

  return (
    <div className="space-y-6">
      {!dbReady && <DbSetupBanner />}
      <PageHeader kicker="Programa" title="Cronograma" subtitle="Horarios oficiales del día de pista" />
      {schedules.length ? (
        <div className="grid gap-2">
          {schedules.map((s) =>
            s.pdf_url ? (
              <PdfLink key={s.id} href={s.pdf_url} label={s.title} />
            ) : (
              <div key={s.id} className="border border-neutral-800 px-4 py-3 text-sm text-white">
                {s.title}
              </div>
            )
          )}
        </div>
      ) : (
        <EmptyState message="Sin cronogramas publicados." />
      )}
    </div>
  );
}
