import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { DbSetupBanner } from "@/components/ui";
import {
  resolveLiveTimingUrl,
  SPEEDHIVE_PORTAL_URL,
} from "@/lib/live-config";
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

  const live = config.live;
  const timingUrl = resolveLiveTimingUrl(live);
  const isLiveSession =
    live?.is_live && timingUrl !== SPEEDHIVE_PORTAL_URL;

  return (
    <div className="space-y-6">
      {!dbReady && <DbSetupBanner />}
      <PageHeader
        kicker="Live Timing"
        title="Tiempos en Vivo"
        subtitle="Cronometraje en tiempo real vía Speedhive"
      />

      <div className="border border-neutral-800 bg-neutral-900/30 px-5 py-4 text-sm text-neutral-400">
        <p>
          IAME Series Argentina utiliza{" "}
          <a
            href={SPEEDHIVE_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-iame-sky hover:underline"
          >
            Speedhive
          </a>
          , la misma plataforma de cronometraje que el Campeonato Argentino de Karting.
        </p>
      </div>

      <div className="border border-iame-navy/40 bg-iame-navy/10 px-6 py-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-iame-sky">
          {isLiveSession ? "Sesión en vivo" : "Cronometraje oficial"}
          {live?.round_label ? ` — ${live.round_label}` : ""}
        </p>
        <p className="mx-auto mt-3 max-w-lg text-sm text-neutral-400">
          Consultá los tiempos en vivo en Speedhive. En fin de semana de carrera
          buscá el evento IAME Series Argentina.
        </p>
        <a
          href={timingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block bg-iame-red px-8 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-iame-red/90"
        >
          Abrir Speedhive ↗
        </a>
        <p className="mt-4 font-mono text-[10px] text-neutral-600">
          {SPEEDHIVE_PORTAL_URL}
        </p>
      </div>

      {isLiveSession && (
        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
            Sesión activa
          </p>
          <Link
            href={timingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-iame-sky hover:underline"
          >
            Abrir sesión en curso ↗
          </Link>
        </div>
      )}
    </div>
  );
}
