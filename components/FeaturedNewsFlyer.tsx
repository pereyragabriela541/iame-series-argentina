import Link from "next/link";
import NewsImageCarousel from "@/components/NewsImageCarousel";
import { PdfLink } from "@/components/ui";
import { extraNewsImages, newsPdf } from "@/lib/news-assets";
import type { NewsArticle } from "@/lib/types";

interface FeaturedNewsFlyerProps {
  article: NewsArticle;
  showInscriptionCta?: boolean;
  showExtraPages?: boolean;
}

export default function FeaturedNewsFlyer({
  article,
  showInscriptionCta = false,
  showExtraPages = false,
}: FeaturedNewsFlyerProps) {
  const extra = showExtraPages ? extraNewsImages(article.slug) : [];
  const pdf = newsPdf(article.slug);
  const href = article.slug ? `/noticias/${article.slug}` : null;
  const images = extra.length ? extra : article.image_url ? [article.image_url] : [];

  return (
    <article className="w-full border border-neutral-800 bg-neutral-900/20">
      <NewsImageCarousel images={images} title={article.title} />
      {(article.body || article.excerpt || showInscriptionCta || pdf) && (
        <div className="space-y-4 border-t border-neutral-800 bg-neutral-900/40 px-5 py-5 sm:px-6">
          {(article.body || article.excerpt) && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-300 sm:text-base">
              {article.body ?? article.excerpt}
            </p>
          )}
          {href && images.length > 1 ? (
            <Link
              href={href}
              className="inline-block text-xs font-bold uppercase tracking-wider text-iame-sky hover:underline"
            >
              Ver noticia completa →
            </Link>
          ) : null}
          {pdf ? <PdfLink href={pdf.href} label={pdf.label} /> : null}
          {showInscriptionCta && article.show_inscription_cta && (
            <Link
              href="/inscripcion"
              className="inline-block bg-iame-red px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-iame-red/90"
            >
              Inscribite ahora
            </Link>
          )}
        </div>
      )}
    </article>
  );
}
