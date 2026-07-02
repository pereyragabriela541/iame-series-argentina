import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { DbSetupBanner } from "@/components/ui";
import { resolveLiveTimingUrl } from "@/lib/live-config";
import type { AppConfig } from "@/lib/types";
import { getAppConfig } from "@/lib/queries";

export const metadata = { title: "Tiempos en Vivo | IAME Series Argentina" };

const SPEEDHIVE_URL = "https://www.speedhive.org/";

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
            href={SPEEDHIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-iame-sky hover:underline"
          >
            Speedhive
          </a>
          , la misma plataforma de cronometraje que el Campeonato Argentino de Karting.
          En días de carrera el enlace de la sesión se publica acá.
        </p>
      </div>

      {timingUrl ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-iame-red">
              {live?.is_live ? "Sesión en vivo" : "Cronometraje disponible"}
              {live?.round_label ? ` — ${live.round_label}` : ""}
            </p>
            <Link
              href={timingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-semibold uppercase tracking-widest text-iame-sky hover:underline"
            >
              Abrir en Speedhive ↗
            </Link>
          </div>
          <div className="border border-neutral-800">
            <iframe
              src={timingUrl}
              title="Live Timing IAME — Speedhive"
              className="h-[70vh] w-full bg-neutral-900"
            />
          </div>
        </div>
      ) : (
        <div className="border border-iame-red/30 bg-iame-navy/10 px-6 py-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-iame-red">
            {live?.is_live ? "Sesión en vivo" : "Sin cronometraje activo"}
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm text-neutral-400">
            {live?.is_live
              ? "La organización publicará el enlace de Speedhive cuando arranque la sesión."
              : "Fuera de fecha de carrera no hay tiempos en vivo. Volvé en el fin de semana de competencia."}
          </p>
          <a
            href={SPEEDHIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block border border-iame-navy bg-iame-navy/30 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-iame-navy/50"
          >
            Ir a Speedhive
          </a>
        </div>
      )}
    </div>
  );
}
