import GalleryCarousel from "@/components/GalleryCarousel";
import PageHeader from "@/components/PageHeader";
import { DbSetupBanner, EmptyState } from "@/components/ui";
import {
  getEmptySectionMessage,
  getMediaPageHeader,
  groupMediaImagesByRound,
} from "@/lib/gallery";
import {
  getActiveSeason,
  getMediaImages,
  getMediaSections,
  getRounds,
} from "@/lib/queries";
import type { MediaImage, MediaSection, Round } from "@/lib/types";

export const metadata = { title: "Imágenes | IAME Series Argentina" };
export const dynamic = "force-dynamic";

export default async function ImagenesPage() {
  let images: MediaImage[] = [];
  let rounds: Round[] = [];
  let mediaSections: MediaSection[] = [];
  let dbReady = true;

  try {
    const [fetchedImages, season, sections] = await Promise.all([
      getMediaImages(),
      getActiveSeason(),
      getMediaSections("images"),
    ]);
    images = fetchedImages;
    mediaSections = sections;
    if (season) rounds = await getRounds(season.id);
  } catch {
    dbReady = false;
  }

  const page = getMediaPageHeader(mediaSections, "images", {
    kicker: "Galería",
    title: "Imágenes",
  });
  const sections = groupMediaImagesByRound(images, rounds, mediaSections);

  return (
    <div className="space-y-8">
      {!dbReady && <DbSetupBanner />}
      <PageHeader kicker={page.kicker} title={page.title} subtitle={page.subtitle} />
      {sections.length ? (
        sections.map((section) => (
          <section key={section.key} className="space-y-4">
            <div className="space-y-2 border-b border-neutral-800 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-white">
                {section.title}
              </h2>
              {section.subtitle && (
                <p className="text-sm font-semibold text-iame-sky">{section.subtitle}</p>
              )}
              {section.description?.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-relaxed text-neutral-400">
                  {paragraph}
                </p>
              ))}
            </div>
            {section.blocks.length ? (
              section.blocks.map((block) => (
                <div key={block.key} className="space-y-3">
                  {block.subtitle && (
                    <p className="text-sm font-semibold leading-relaxed text-iame-sky">
                      {block.subtitle}
                    </p>
                  )}
                  <GalleryCarousel images={block.images} />
                </div>
              ))
            ) : section.roundNumber != null ? (
              <p className="text-sm text-neutral-500">
                {getEmptySectionMessage(section.isUpcoming)}
              </p>
            ) : null}
          </section>
        ))
      ) : (
        <EmptyState message="Sin imágenes en la galería." />
      )}
    </div>
  );
}
