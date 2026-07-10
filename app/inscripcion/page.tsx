import PageHeader from "@/components/PageHeader";
import InscriptionForm from "@/components/InscriptionForm";
import { DbSetupBanner } from "@/components/ui";
import {
  categoriesToOptions,
  INSCRIPTION_CATEGORIES,
  INSCRIPTION_ROUNDS_OPEN,
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

export default async function InscripcionPage() {
  let enabled = true;
  let dbReady = true;

  let roundOptions = INSCRIPTION_ROUNDS_OPEN;
  let categoryOptions = INSCRIPTION_CATEGORIES;

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
        subtitle="Formulario de inscripción al Campeonato IAME Series Argentina 2026"
      />
      <InscriptionForm
        rounds={roundOptions}
        categories={categoryOptions}
        enabled={enabled}
      />
    </div>
  );
}
