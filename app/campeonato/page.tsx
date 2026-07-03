import PageHeader from "@/components/PageHeader";
import CampeonatoClient from "@/components/CampeonatoClient";
import { DbSetupBanner } from "@/components/ui";
import type { Category } from "@/lib/types";
import {
  getActiveSeason,
  getCategories,
  getStandings,
} from "@/lib/queries";

export const metadata = { title: "Campeonato | IAME Series Argentina" };

export const dynamic = "force-dynamic";

export default async function CampeonatoPage() {
  let dbReady = true;
  let categories: Category[] = [];
  let regularRounds = 10;
  const standingsByCategory: Record<string, Awaited<ReturnType<typeof getStandings>>> = {};

  try {
    const season = await getActiveSeason();
    regularRounds = season?.regular_rounds ?? 10;
    categories = await getCategories();
    if (season) {
      await Promise.all(
        categories.map(async (cat) => {
          standingsByCategory[cat.id] = await getStandings(season.id, cat.id);
        })
      );
    }
  } catch {
    dbReady = false;
  }

  return (
    <div className="space-y-6">
      {!dbReady && <DbSetupBanner />}
      <PageHeader
        kicker="Posiciones"
        title="Campeonato"
        subtitle={`Clasificación general por categoría — ${regularRounds} fechas etapa regular`}
      />
      {categories.length ? (
        <CampeonatoClient categories={categories} standingsByCategory={standingsByCategory} />
      ) : (
        <p className="text-sm text-neutral-500">Sin categorías cargadas.</p>
      )}
    </div>
  );
}
