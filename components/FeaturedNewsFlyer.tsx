import Link from "next/link";
import type { NewsArticle } from "@/lib/types";

interface FeaturedNewsFlyerProps {
  article: NewsArticle;
  showInscriptionCta?: boolean;
}

export default function FeaturedNewsFlyer({
  article,
  showInscriptionCta = false,
}: FeaturedNewsFlyerProps) {
  return (
    <article className="w-full border border-neutral-800 bg-neutral-900/20">
      {article.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.image_url}
          alt={article.title}
          className="block w-full bg-neutral-950 object-contain"
        />
      )}
      {(article.body || article.excerpt || showInscriptionCta) && (
        <div className="space-y-4 border-t border-neutral-800 bg-neutral-900/40 px-5 py-5 sm:px-6">
          {(article.body || article.excerpt) && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-300 sm:text-base">
              {article.body ?? article.excerpt}
            </p>
          )}
          {showInscriptionCta && article.slug === "fecha-5" && (
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
