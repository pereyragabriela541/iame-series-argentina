import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Fecha6DuosGrid from "@/components/Fecha6DuosGrid";
import NewsImageCarousel from "@/components/NewsImageCarousel";
import { DbSetupBanner, PdfLink } from "@/components/ui";
import type { Fecha6Duo } from "@/lib/fecha6-duos";
import { extraNewsImages, newsPdf } from "@/lib/news-assets";
import { formatDate, getDuosForRound, getNewsBySlug } from "@/lib/queries";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

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
  let duos: Fecha6Duo[] = [];
  try {
    article = await getNewsBySlug(slug);
    const roundKey = article?.gallery_round_key?.trim();
    if (article?.show_duos_gallery && roundKey) {
      duos = await getDuosForRound(roundKey);
    }
  } catch {
    return <DbSetupBanner />;
  }
  if (!article) notFound();

  const showDuos = Boolean(article.show_duos_gallery);
  const extra = extraNewsImages(article.slug);
  const pdf = newsPdf(article.slug);
  const images = extra.length ? extra : article.image_url ? [article.image_url] : [];

  return (
    <article className="space-y-6">
      <Link href="/noticias" className="text-[10px] font-semibold uppercase tracking-widest text-iame-red hover:underline">
        ← Noticias
      </Link>
      <PageHeader
        kicker={article.category || undefined}
        title={article.title}
        subtitle={formatDate(article.published_at)}
      />
      {article.image_url && !showDuos ? (
        <NewsImageCarousel images={images} title={article.title} />
      ) : null}

      <div className="space-y-4 border border-neutral-800 bg-neutral-900/40 px-5 py-5 sm:px-6">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-300">
          {article.body ?? article.excerpt}
        </p>
        {pdf ? <PdfLink href={pdf.href} label={pdf.label} /> : null}
        {article.show_inscription_cta && (
          <Link
            href="/inscripcion"
            className="inline-block bg-iame-red px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-iame-red/90"
          >
            Inscribite ahora
          </Link>
        )}
      </div>

      {showDuos ? (
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white">
            Dúos publicados ({duos.length})
          </h2>
          <Fecha6DuosGrid duos={duos} />
        </section>
      ) : null}
    </article>
  );
}
