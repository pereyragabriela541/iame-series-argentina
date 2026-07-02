import PageHeader from "@/components/PageHeader";
import { DbSetupBanner, EmptyState } from "@/components/ui";
import type { MediaVideo } from "@/lib/types";
import { getMediaVideos } from "@/lib/queries";

export const metadata = { title: "Videos | IAME Series Argentina" };

export default async function VideosPage() {
  let videos: MediaVideo[] = [];
  let dbReady = true;
  try {
    videos = await getMediaVideos();
  } catch {
    dbReady = false;
  }

  return (
    <div className="space-y-6">
      {!dbReady && <DbSetupBanner />}
      <PageHeader kicker="Media" title="Videos" />
      {videos.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {videos.map((v) => (
            <a
              key={v.id}
              href={v.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-neutral-800 bg-neutral-900/40 p-4 transition hover:border-iame-red"
            >
              <p className="text-sm font-bold uppercase text-white">{v.title}</p>
              <p className="mt-1 font-mono text-[10px] text-neutral-500">Ver video →</p>
            </a>
          ))}
        </div>
      ) : (
        <EmptyState message="Sin videos publicados." />
      )}
    </div>
  );
}
