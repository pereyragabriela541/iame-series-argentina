import HomeHero from "@/components/HomeHero";
import FeaturedNewsFlyer from "@/components/FeaturedNewsFlyer";
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

  const featuredNews = news.find((n) => n.image_url) ?? news[0] ?? null;

  return (
    <div className="space-y-10">
      {!dbReady && <DbSetupBanner />}

      <HomeHero
        round={nextRound}
        imageUrl={heroMedia.imageUrl}
        inscriptionOpen={inscriptionOpen}
        hasResults={hasResults}
        error={dbReady ? null : "db"}
      />

      {featuredNews && (
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-lg font-bold uppercase text-white">Noticias</h2>
            <Link
              href="/noticias"
              className="text-[10px] font-semibold uppercase tracking-widest text-iame-red hover:underline"
            >
              Ver todas
            </Link>
          </div>
          <FeaturedNewsFlyer
            article={featuredNews}
            showInscriptionCta
            showExtraPages
          />
        </section>
      )}
    </div>
  );
}
