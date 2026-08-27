import PageHeader from "@/components/PageHeader";
import InscriptionForm from "@/components/InscriptionForm";
import { DbSetupBanner } from "@/components/ui";
import {
  categoriesToOptions,
  roundsToOptions,
} from "@/lib/inscription-data";
import {
  getActiveSeason,
  getAppConfig,
  getCategories,
  getRounds,
} from "@/lib/queries";
import { inscriptionMetadata } from "@/lib/seo";

export const metadata = inscriptionMetadata;

export default async function InscripcionPage({
  searchParams,
}: {
  searchParams: Promise<{ rid?: string; round?: string }>;
}) {
  const { rid, round } = await searchParams;
  const resumeId = typeof rid === "string" ? rid.trim() : "";

  let enabled = true;
  let dbReady = true;

  let roundOptions: ReturnType<typeof roundsToOptions> = [];
  let categoryOptions: ReturnType<typeof categoriesToOptions> = [];

  try {
    const [season, config, cats] = await Promise.all([
      getActiveSeason(),
      getAppConfig(),
      getCategories(),
    ]);
    enabled = config.temporada?.inscripcion_habilitada ?? true;
    const rounds = season ? await getRounds(season.id) : [];
    roundOptions = roundsToOptions(rounds);
    categoryOptions = categoriesToOptions(cats);
  } catch {
    dbReady = false;
  }

  return (
    <div className="space-y-6">
      {!dbReady && <DbSetupBanner />}
      <PageHeader
        kicker="Oficial"
        title="Inscripción"
        subtitle={
          resumeId
            ? "Completá tu inscripción reservando el turno de administración"
            : "Formulario de inscripción al Campeonato IAME Series Argentina"
        }
      />
      <InscriptionForm
        rounds={roundOptions}
        categories={categoryOptions}
        enabled={enabled}
        resumeId={resumeId || undefined}
        initialRoundId={typeof round === "string" ? round.trim() : undefined}
      />
    </div>
  );
}
