import PageHeader from "@/components/PageHeader";
import { DbSetupBanner } from "@/components/ui";
import type { AppConfig } from "@/lib/types";
import { getAppConfig } from "@/lib/queries";

export const metadata = { title: "Transmisión | IAME Series Argentina" };

export default async function TransmisionPage() {
  let config: AppConfig = {};
  let dbReady = true;
  try {
    config = await getAppConfig();
  } catch {
    dbReady = false;
  }

  const tx = config.transmision;

  return (
    <div className="space-y-6">
      {!dbReady && <DbSetupBanner />}
      <PageHeader
        kicker="Streaming"
        title={tx?.titulo ?? "Transmisión en Vivo"}
        subtitle={tx?.descripcion}
      />
      {tx?.url ? (
        <div className="aspect-video border border-neutral-800">
          <iframe
            src={tx.url}
            title="Transmisión IAME"
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <p className="border border-neutral-800 px-4 py-8 text-center text-sm text-neutral-500">
          La transmisión se publicará antes de cada fecha. Editá <code className="text-iame-sky">transmision</code> en Supabase.
        </p>
      )}
    </div>
  );
}
