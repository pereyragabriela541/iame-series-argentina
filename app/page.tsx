import Link from "next/link";
import HomeHero from "@/components/HomeHero";
import NewsCard from "@/components/NewsCard";
import RoundCard from "@/components/RoundCard";
import RoundCountdown from "@/components/RoundCountdown";
import { DbSetupBanner } from "@/components/ui";
import {
  getActiveSeason,
  getAppConfig,
  getNews,
  getRounds,
} from "@/lib/queries";
import type { AppConfig, NewsArticle, Round } from "@/lib/types";

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
      getNews(3),
    ]);
    if (season) rounds = await getRounds(season.id);
  } catch {
    dbReady = false;
  }

  const year = config.temporada?.year ?? 2026;
  const nextRound =
    rounds
      .filter((r) => r.status === "upcoming" || r.status === "live")
      .sort((a, b) => a.round_number - b.round_number)[0] ?? rounds[0];

  return (
    <div className="space-y-10">
      {!dbReady && <DbSetupBanner />}

      <HomeHero year={year} regularRounds={season?.regular_rounds ?? 10} />

      {nextRound && (
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-iame-sky">
                Próxima fecha
              </p>
              <h2 className="text-lg font-bold uppercase text-white">{nextRound.name}</h2>
            </div>
            <Link href="/calendario" className="text-[10px] font-semibold uppercase tracking-widest text-iame-red hover:underline">
              Ver calendario
            </Link>
          </div>
          <RoundCountdown round={nextRound} />
          <RoundCard round={nextRound} />
        </section>
      )}

      {news.length > 0 && (
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-lg font-bold uppercase text-white">Noticias</h2>
            <Link href="/noticias" className="text-[10px] font-semibold uppercase tracking-widest text-iame-red hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((n) => (
              <NewsCard key={n.id} article={n} />
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/tiempos", label: "Tiempos en Vivo", color: "border-iame-red" },
          { href: "/transmision", label: "Transmisión", color: "border-iame-sky" },
          { href: "/inscripcion", label: "Inscripción", color: "border-iame-navy" },
          { href: "/reglamentos", label: "Reglamentos", color: "border-neutral-600" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`border-l-4 ${item.color} bg-neutral-900/40 px-4 py-5 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-neutral-900`}
          >
            {item.label}
          </Link>
        ))}
      </section>
    </div>
  );
}
