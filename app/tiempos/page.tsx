import PageHeader from "@/components/PageHeader";
import { DbSetupBanner } from "@/components/ui";
import { resolveLiveTimingUrl } from "@/lib/live-config";
import type { AppConfig } from "@/lib/types";
import { getAppConfig } from "@/lib/queries";

export const metadata = { title: "Tiempos en Vivo | IAME Series Argentina" };

export default async function TiemposPage() {
  let config: AppConfig = {};
  let dbReady = true;
  try {
    config = await getAppConfig();
  } catch {
    dbReady = false;
  }

  const timingUrl = resolveLiveTimingUrl(config.live);

  return (
    <div className="space-y-6">
      {!dbReady && <DbSetupBanner />}
      <PageHeader
        kicker="Live Timing"
        title="Tiempos en Vivo"
        subtitle="Cronometraje en tiempo real vía Speedhive"
      />

      <div className="border border-iame-navy/40 bg-iame-navy/10 px-6 py-10 text-center">
        <a
          href={timingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-iame-red px-8 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-iame-red/90"
        >
          Abrir Speedhive ↗
        </a>
      </div>
    </div>
  );
}
