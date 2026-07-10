import PageHeader from "@/components/PageHeader";
import RoundCard from "@/components/RoundCard";
import { DbSetupBanner } from "@/components/ui";
import type { Round } from "@/lib/types";
import { getActiveSeason, getAppConfig, getRounds } from "@/lib/queries";
import { calendarMetadata } from "@/lib/seo";

export const metadata = calendarMetadata;

export default async function CalendarioPage() {
  let rounds: Round[] = [];
  let year = 2026;
  let dbReady = true;

  try {
    const [season, config] = await Promise.all([getActiveSeason(), getAppConfig()]);
    year = config.temporada?.year ?? season?.year ?? 2026;
    if (season) rounds = await getRounds(season.id);
  } catch {
    dbReady = false;
  }

  return (
    <div className="space-y-6">
      {!dbReady && <DbSetupBanner />}
      <PageHeader
        kicker={`Temporada ${year}`}
        title="Calendario"
        subtitle={`${rounds.length ? `${rounds.length} fechas` : "11 fechas"} — Calendario oficial IAME Series Argentina`}
      />
      <div className="grid gap-3">
        {rounds.map((r) => <RoundCard key={r.id} round={r} />)}
      </div>
    </div>
  );
}
