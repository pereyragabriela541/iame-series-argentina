import PageHeader from "@/components/PageHeader";
import NewsCard from "@/components/NewsCard";
import { DbSetupBanner } from "@/components/ui";
import type { NewsArticle } from "@/lib/types";
import { getNews } from "@/lib/queries";

export const metadata = { title: "Noticias | IAME Series Argentina" };

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
      {news.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {news.map((n) => <NewsCard key={n.id} article={n} />)}
        </div>
      ) : (
        <p className="text-sm text-neutral-500">No hay noticias publicadas.</p>
      )}
    </div>
  );
}
