import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import StandingsTable from "@/components/StandingsTable";
import { DbSetupBanner } from "@/components/ui";
import type { Category } from "@/lib/types";
import {
  getActiveSeason,
  getCategories,
  getStandings,
} from "@/lib/queries";

export const metadata = { title: "Campeonato | IAME Series Argentina" };

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function CampeonatoPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat: catSlug } = await searchParams;
  let dbReady = true;
  let dbError = "";
  let categories: Category[] = [];
  let regularRounds = 10;
  let standings: Awaited<ReturnType<typeof getStandings>> = [];

  try {
    const season = await getActiveSeason();
    regularRounds = season?.regular_rounds ?? 10;
    categories = await getCategories();
    const activeCat =
      categories.find((c) => c.slug === catSlug) ?? categories[0];

    if (season && activeCat) {
      standings = await getStandings(season.id, activeCat.id);
    }
  } catch (e) {
    dbReady = false;
    dbError = e instanceof Error ? e.message : "No se pudo conectar a la base";
  }

  const activeCat =
    categories.find((c) => c.slug === catSlug) ?? categories[0];

  return (
    <div className="space-y-6">
      {!dbReady && (
        <>
          <DbSetupBanner />
          {dbError && (
            <p className="text-sm text-iame-red">
              Error: {dbError}. Revisá las variables de Supabase en Vercel.
            </p>
          )}
        </>
      )}
      <PageHeader
        kicker="Posiciones"
        title="Campeonato"
        subtitle={`Clasificación general por categoría — ${regularRounds} fechas etapa regular`}
      />
      {activeCat && dbReady && (
        <p className="text-xs text-neutral-500">
          {activeCat.name}: {standings.length} piloto
          {standings.length === 1 ? "" : "s"} cargado
          {standings.length === 1 ? "" : "s"}
        </p>
      )}
      {categories.length ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 border-b border-neutral-800 pb-3">
            {categories.map((cat) => {
              const isActive = activeCat?.id === cat.id;
              return (
                <Link
                  key={cat.id}
                  href={`/campeonato?cat=${cat.slug}`}
                  scroll={false}
                  className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-wide transition sm:text-xs ${
                    isActive
                      ? "bg-iame-navy text-white"
                      : "border border-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                  style={
                    isActive && cat.color
                      ? { backgroundColor: cat.color }
                      : undefined
                  }
                >
                  {cat.name}
                </Link>
              );
            })}
          </div>
          <StandingsTable standings={standings} showSessions={false} />
        </div>
      ) : (
        <p className="text-sm text-neutral-500">
          Sin categorías cargadas.{" "}
          <a
            href="/api/campeonato/status"
            className="text-iame-sky underline-offset-2 hover:underline"
          >
            Ver estado de la base
          </a>
        </p>
      )}
    </div>
  );
}
