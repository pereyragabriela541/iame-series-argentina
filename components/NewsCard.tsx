import Link from "next/link";
import type { NewsArticle } from "@/lib/types";
import { formatDate } from "@/lib/queries";

export default function NewsCard({ article }: { article: NewsArticle }) {
  const href = article.slug ? `/noticias/${article.slug}` : `/noticias#${article.id}`;

  return (
    <Link
      href={href}
      className="group block border border-neutral-800 bg-neutral-900/30 transition hover:border-iame-red/50"
    >
      {article.image_url && (
        <div
          className="h-40 bg-cover bg-center"
          style={{ backgroundImage: `url(${article.image_url})` }}
        />
      )}
      <div className="p-4">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-iame-red">
          {article.category ?? "General"}
        </span>
        <h3 className="mt-1 text-sm font-bold uppercase leading-snug tracking-wide text-white group-hover:text-iame-sky">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="mt-2 line-clamp-2 text-xs text-neutral-400">
            {article.excerpt}
          </p>
        )}
        <p className="mt-3 font-mono text-[10px] text-neutral-600">
          {formatDate(article.published_at)}
        </p>
      </div>
    </Link>
  );
}
