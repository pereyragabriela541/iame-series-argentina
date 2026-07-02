import PageHeader from "@/components/PageHeader";
import { DbSetupBanner, EmptyState } from "@/components/ui";
import type { MediaImage } from "@/lib/types";
import { getMediaImages } from "@/lib/queries";

export const metadata = { title: "Imágenes | IAME Series Argentina" };

export default async function ImagenesPage() {
  let images: MediaImage[] = [];
  let dbReady = true;
  try {
    images = await getMediaImages();
  } catch {
    dbReady = false;
  }

  return (
    <div className="space-y-6">
      {!dbReady && <DbSetupBanner />}
      <PageHeader kicker="Galería" title="Imágenes" />
      {images.length ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img) => (
            <a
              key={img.id}
              href={img.image_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group overflow-hidden border border-neutral-800"
            >
              <div
                className="aspect-video bg-cover bg-center transition group-hover:scale-105"
                style={{ backgroundImage: `url(${img.image_url})` }}
              />
              {img.title && (
                <p className="px-3 py-2 text-xs font-semibold uppercase text-white">{img.title}</p>
              )}
            </a>
          ))}
        </div>
      ) : (
        <EmptyState message="Sin imágenes en la galería." />
      )}
    </div>
  );
}
