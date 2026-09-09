import Link from "next/link";
import type { NewsArticle } from "@/lib/types";
import { formatDate } from "@/lib/queries";

export default function NewsCard({
  article,
}: {
  article: NewsArticle;
}) {
  const href = article.slug ? `/noticias/${article.slug}` : `/noticias#${article.id}`;

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden border border-neutral-800 bg-neutral-900/30 transition hover:border-iame-red/50"
    >
      <div
        className="flex w-full shrink-0 items-center justify-center overflow-hidden bg-neutral-950"
        style={{ height: "11rem" }}
      >
        {article.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.image_url}
            alt=""
            loading="lazy"
            style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {article.category ? (
          <span className="truncate text-[10px] font-semibold uppercase tracking-widest text-iame-red">
            {article.category}
          </span>
        ) : null}
        <h3
          className={`line-clamp-2 text-sm font-bold uppercase leading-snug tracking-wide text-white group-hover:text-iame-sky ${
            article.category ? "mt-1" : ""
          }`}
        >
          {article.title}
        </h3>
        {article.excerpt ? (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-neutral-400">
            {article.excerpt}
          </p>
        ) : null}
        <p className="mt-auto pt-2 font-mono text-[10px] text-neutral-600">
          {formatDate(article.published_at)}
        </p>
      </div>
    </Link>
  );
}
