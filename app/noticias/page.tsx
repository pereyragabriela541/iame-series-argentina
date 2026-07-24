import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import FeaturedNewsFlyer from "@/components/FeaturedNewsFlyer";
import Fecha6DuosGrid from "@/components/Fecha6DuosGrid";
import NewsCard from "@/components/NewsCard";
import { DbSetupBanner } from "@/components/ui";
import type { Fecha6Duo } from "@/lib/fecha6-duos";
import type { NewsArticle } from "@/lib/types";
import { getFecha6Duos, getNews } from "@/lib/queries";
import { newsMetadata } from "@/lib/seo";

export const metadata = newsMetadata;
export const dynamic = "force-dynamic";

function pickFeaturedFlyer(news: NewsArticle[]) {
  return news.find((n) => n.image_url) ?? news[0] ?? null;
}

export default async function NoticiasPage() {
  let news: NewsArticle[] = [];
  let duos: Fecha6Duo[] = [];
  let dbReady = true;
  try {
    [news, duos] = await Promise.all([getNews(), getFecha6Duos()]);
  } catch {
    dbReady = false;
  }

  const featured = pickFeaturedFlyer(news.filter((n) => n.slug !== "duos-fecha-6"));
  const rest = featured
    ? news.filter((n) => n.id !== featured.id && n.slug !== "duos-fecha-6")
    : news.filter((n) => n.slug !== "duos-fecha-6");

  return (
    <div className="space-y-6">
      {!dbReady && <DbSetupBanner />}
      <PageHeader kicker="Novedades" title="Noticias" subtitle="Comunicados oficiales del campeonato" />
      {featured ? (
        <FeaturedNewsFlyer article={featured} showInscriptionCta />
      ) : dbReady ? (
        <p className="text-sm text-neutral-500">No hay noticias publicadas.</p>
      ) : null}

      <section className="space-y-4 border border-neutral-800 bg-neutral-900/30 p-5 sm:p-6">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-iame-red">
            Fecha 6
          </p>
          <h2 className="text-lg font-bold uppercase tracking-wide text-white">
            Dúos inscriptos
          </h2>
          <p className="text-sm leading-relaxed text-neutral-400">
            Titular + piloto invitado. Las fotos se publican al completar la
            inscripción en la web.
          </p>
          <Link
            href="/noticias/duos-fecha-6"
            className="inline-block text-[10px] font-semibold uppercase tracking-widest text-iame-sky hover:underline"
          >
            Ver nota completa →
          </Link>
        </div>
        <Fecha6DuosGrid duos={duos} />
      </section>

      {rest.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((n) => (
            <NewsCard key={n.id} article={n} />
          ))}
        </div>
      )}
    </div>
  );
}
