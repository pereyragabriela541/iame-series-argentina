import PageHeader from "@/components/PageHeader";
import { DbSetupBanner, EmptyState } from "@/components/ui";
import {
  getEmptySectionMessage,
  getMediaPageHeader,
  groupMediaVideosByRound,
} from "@/lib/gallery";
import {
  getActiveSeason,
  getMediaSections,
  getMediaVideos,
  getRounds,
} from "@/lib/queries";
import type { MediaSection, MediaVideo, Round } from "@/lib/types";

export const metadata = { title: "Videos | IAME Series Argentina" };
export const dynamic = "force-dynamic";

export default async function VideosPage() {
  let videos: MediaVideo[] = [];
  let rounds: Round[] = [];
  let mediaSections: MediaSection[] = [];
  let dbReady = true;

  try {
    const [fetchedVideos, season, sections] = await Promise.all([
      getMediaVideos(),
      getActiveSeason(),
      getMediaSections("videos"),
    ]);
    videos = fetchedVideos;
    mediaSections = sections;
    if (season) rounds = await getRounds(season.id);
  } catch {
    dbReady = false;
  }

  const page = getMediaPageHeader(mediaSections, "videos", {
    kicker: "Media",
    title: "Videos",
  });
  const sections = groupMediaVideosByRound(videos, rounds, mediaSections);
  const hasSections = sections.length > 0;

  return (
    <div className="space-y-8">
      {!dbReady && <DbSetupBanner />}
      <PageHeader kicker={page.kicker} title={page.title} subtitle={page.subtitle} />
      {hasSections ? (
        sections.map((section) => (
          <section key={section.key} className="space-y-3">
            {(section.roundNumber != null ||
              section.subtitle ||
              section.description?.length) && (
              <div className="space-y-2 border-b border-neutral-800 pb-3">
                {section.roundNumber != null && (
                  <h2 className="text-sm font-bold uppercase tracking-wide text-white">
                    {section.title}
                  </h2>
                )}
                {section.subtitle && (
                  <p className="text-sm font-semibold text-iame-sky">{section.subtitle}</p>
                )}
                {section.description?.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-relaxed text-neutral-400">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}
            {section.videos.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {section.videos.map((v) => {
                  const longTitle = v.title.length > 80;
                  return (
                    <a
                      key={v.id}
                      href={v.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-neutral-800 bg-neutral-900/40 p-4 transition hover:border-iame-red"
                    >
                      <p
                        className={
                          longTitle
                            ? "text-sm leading-relaxed text-neutral-200"
                            : "text-sm font-bold uppercase text-white"
                        }
                      >
                        {v.title}
                      </p>
                      <p className="mt-2 font-mono text-[10px] text-neutral-500">Ver video →</p>
                    </a>
                  );
                })}
              </div>
            ) : section.roundNumber != null ? (
              <p className="text-sm text-neutral-500">
                {getEmptySectionMessage(section.isUpcoming)}
              </p>
            ) : null}
          </section>
        ))
      ) : (
        <EmptyState message="Sin videos publicados." />
      )}
    </div>
  );
}
