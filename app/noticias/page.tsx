import PageHeader from "@/components/PageHeader";
import NewsCard from "@/components/NewsCard";
import { DbSetupBanner } from "@/components/ui";
import type { NewsArticle } from "@/lib/types";
import { getNews } from "@/lib/queries";
import { newsMetadata } from "@/lib/seo";

export const metadata = newsMetadata;
export const dynamic = "force-dynamic";

export default async function NoticiasPage() {
  let news: NewsArticle[] = [];
  let dbReady = true;
  try {
    news = await getNews();
  } catch {
    dbReady = false;
  }

  return (
    <div className="space-y-6">
      {!dbReady && <DbSetupBanner />}
      <PageHeader kicker="Novedades" title="Noticias" subtitle="Comunicados oficiales del campeonato" />
      {news.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {news.map((n) => (
            <NewsCard key={n.id} article={n} />
          ))}
        </div>
      )}
    </div>
  );
}
