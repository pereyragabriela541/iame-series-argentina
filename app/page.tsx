import HomeHero from "@/components/HomeHero";
import HomeNewsCarousel from "@/components/HomeNewsCarousel";
import { DbSetupBanner } from "@/components/ui";
import {
  getActiveSeason,
  getAppConfig,
  getHeroMediaForRound,
  getNews,
  getRoundResults,
  getRounds,
} from "@/lib/queries";
import { getHomeEventPhase, selectHomeRound } from "@/lib/next-round";
import type { AppConfig, NewsArticle, Round } from "@/lib/types";
import { homeMetadata } from "@/lib/seo";
import Link from "next/link";

export const metadata = homeMetadata;

export default async function HomePage() {
  let season = null;
  let rounds: Round[] = [];
  let news: NewsArticle[] = [];
  let config: AppConfig = {};
  let dbReady = true;

  try {
    [season, config, news] = await Promise.all([
      getActiveSeason(),
      getAppConfig(),
      getNews(),
    ]);
    if (season) rounds = await getRounds(season.id);
  } catch {
    dbReady = false;
  }

  const nextRound = selectHomeRound(rounds);
  let heroMedia = { imageUrl: null as string | null, videoUrl: null as string | null };
  try {
    heroMedia = await getHeroMediaForRound(nextRound);
  } catch {
    heroMedia = { imageUrl: null, videoUrl: null };
  }
  const phase = nextRound ? getHomeEventPhase(nextRound) : "upcoming";
  const inscriptionOpen = Boolean(nextRound) &&
    nextRound?.registration_open !== false &&
    config.temporada?.inscripcion_habilitada !== false && phase !== "finished";

  let hasResults = false;
  if (nextRound && phase === "finished") {
    try {
      hasResults = (await getRoundResults(nextRound.id)).length > 0;
    } catch {
      hasResults = false;
    }
  }

  return (
    <div className="space-y-8">
      {!dbReady && <DbSetupBanner />}

      <HomeHero
        round={nextRound}
        imageUrl={heroMedia.imageUrl}
        inscriptionOpen={inscriptionOpen}
        hasResults={hasResults}
        error={dbReady ? null : "db"}
      />

      <nav
        aria-label="Accesos principales"
        className="grid grid-cols-3 gap-2 sm:gap-3"
      >
        <HomeShortcut href="/campeonato" label="Campeonato" />
        <HomeShortcut href="/calendario" label="Calendario" />
        <HomeShortcut href="/tiempos" label="Tiempos en vivo" />
      </nav>

      {news.length > 0 && (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-white sm:text-base">
              Noticias
            </h2>
            <Link
              href="/noticias"
              className="text-[10px] font-semibold uppercase tracking-widest text-iame-red hover:underline"
            >
              Ver todas
            </Link>
          </div>
          <HomeNewsCarousel articles={news} />
        </section>
      )}
    </div>
  );
}

function HomeShortcut({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-11 items-center justify-center border border-white/20 bg-[#0A1628] px-2 py-2.5 text-center text-[10px] font-black italic uppercase tracking-[0.12em] text-white transition hover:border-[#E30613]/60 hover:bg-[#122038] sm:min-h-12 sm:text-[11px] sm:tracking-[0.14em]"
    >
      {label}
    </Link>
  );
}
