import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { DbSetupBanner } from "@/components/ui";
import { formatDate, getNewsBySlug } from "@/lib/queries";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getNewsBySlug(slug).catch(() => null);
  return { title: article ? `${article.title} | IAME` : "Noticia" };
}

export default async function NoticiaDetallePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let article = null;
  try {
    article = await getNewsBySlug(slug);
  } catch {
    return <DbSetupBanner />;
  }
  if (!article) notFound();

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Link href="/noticias" className="text-[10px] font-semibold uppercase tracking-widest text-iame-red hover:underline">
        ← Noticias
      </Link>
      <PageHeader
        kicker={article.category ?? "General"}
        title={article.title}
        subtitle={formatDate(article.published_at)}
      />
      {article.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.image_url}
          alt=""
          className="block w-full border border-neutral-800 bg-neutral-950 object-contain"
        />
      )}
      <div className="prose prose-invert max-w-none text-neutral-300">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {article.body ?? article.excerpt}
        </p>
      </div>
    </article>
  );
}
