import { useCallback, useState } from "react";
import { ActivityIndicator } from "react-native";
import { useFocusEffect } from "expo-router";

import InscriptionForm from "@/components/InscriptionForm";
import PageHeader from "@/components/PageHeader";
import Screen from "@/components/Screen";
import {
  categoriesToOptions,
  INSCRIPTION_CATEGORIES,
  roundsToOptions,
} from "@/lib/inscription-data";
import {
  getActiveSeason,
  getAppConfig,
  getCategories,
  getRounds,
} from "@/lib/queries";
import { BRAND } from "@/lib/theme";

export default function InscripcionScreen() {
  const [enabled, setEnabled] = useState(true);
  const [roundOptions, setRoundOptions] = useState(
    [] as ReturnType<typeof roundsToOptions>,
  );
  const [categoryOptions, setCategoryOptions] = useState(INSCRIPTION_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void (async () => {
        try {
          const [season, config, cats] = await Promise.all([
            getActiveSeason(),
            getAppConfig(),
            getCategories(),
          ]);
          setEnabled(config.temporada?.inscripcion_habilitada ?? true);
          const rounds = season ? await getRounds(season.id) : [];
          setRoundOptions(roundsToOptions(rounds));
          setCategoryOptions(categoriesToOptions(cats));
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  return (
    <Screen>
      <PageHeader
        kicker="Oficial"
        title="Inscripción"
        subtitle="Formulario de inscripción al campeonato (BS Proyect)"
      />
      {loading ? (
        <ActivityIndicator color={BRAND.colors.red} />
      ) : (
        <InscriptionForm
          rounds={roundOptions}
          categories={categoryOptions}
          enabled={enabled}
        />
      )}
    </Screen>
  );
}