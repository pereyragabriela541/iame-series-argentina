import PageHeader from "@/components/PageHeader";
import FeaturedNewsFlyer from "@/components/FeaturedNewsFlyer";
import NewsCard from "@/components/NewsCard";
import { DbSetupBanner } from "@/components/ui";
import type { NewsArticle } from "@/lib/types";
import { getNews } from "@/lib/queries";

export const metadata = { title: "Noticias | IAME Series Argentina" };

function pickFeaturedFlyer(news: NewsArticle[]) {
  return news.find((n) => n.slug === "fecha-5") ?? news.find((n) => n.image_url) ?? null;
}

export default async function NoticiasPage() {
  let news: NewsArticle[] = [];
  let dbReady = true;
  try {
    news = await getNews();
  } catch {
    dbReady = false;
  }

  const featured = pickFeaturedFlyer(news);
  const rest = featured ? news.filter((n) => n.id !== featured.id) : news;

  return (
    <div className="space-y-6">
      {!dbReady && <DbSetupBanner />}
      <PageHeader kicker="Novedades" title="Noticias" subtitle="Comunicados oficiales del campeonato" />
      {featured ? (
        <FeaturedNewsFlyer article={featured} showInscriptionCta />
      ) : dbReady ? (
        <p className="text-sm text-neutral-500">No hay noticias publicadas.</p>
      ) : null}
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
