import PageHeader from "@/components/PageHeader";
import { DbSetupBanner } from "@/components/ui";
import { resolveYoutubeUrl } from "@/lib/live-config";
import type { AppConfig } from "@/lib/types";
import { getAppConfig } from "@/lib/queries";

export const metadata = { title: "Transmisión | IAME Series Argentina" };
export const dynamic = "force-dynamic";

export default async function TransmisionPage() {
  let config: AppConfig = {};
  let dbReady = true;
  try {
    config = await getAppConfig();
  } catch {
    dbReady = false;
  }

  const url = resolveYoutubeUrl(config.transmision);

  return (
    <div className="space-y-6">
      {!dbReady && <DbSetupBanner />}
      <PageHeader title="Transmisión en Vivo" />

      <div className="border border-iame-sky/40 bg-iame-sky/10 px-6 py-10 text-center">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-iame-red px-8 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-iame-red/90"
          >
            Ver transmisión en YouTube ↗
          </a>
        ) : (
          <p className="text-sm text-neutral-400">No hay transmisión configurada.</p>
        )}
      </div>
    </div>
  );
}
