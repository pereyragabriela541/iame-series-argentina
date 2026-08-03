import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

import PageHeader from "@/components/PageHeader";
import PrimaryButton from "@/components/PrimaryButton";
import Screen from "@/components/Screen";
import { formatRoundEventDates, getRoundKicker } from "@/lib/calendar-dates";
import {
  getCategories,
  getRoundById,
  getRoundResults,
} from "@/lib/queries";
import { getRoundFlyerBlurb } from "@/lib/round-flyers";
import { resolveMediaUrl } from "@/lib/site";
import { BRAND } from "@/lib/theme";
import type { Category, Round, RoundResult } from "@/lib/types";

export default function RoundDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [round, setRound] = useState<Round | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      setLoading(true);
      void (async () => {
        const [r, cats] = await Promise.all([
          getRoundById(id),
          getCategories(),
        ]);
        setRound(r);
        setCategories(cats);
        if (r) setResults(await getRoundResults(r.id));
        setLoading(false);
      })();
    }, [id]),
  );

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const flyerBlurb = round ? getRoundFlyerBlurb(round.round_number) : null;

  return (
    <Screen>
      {loading || !round ? (
        <ActivityIndicator color={BRAND.colors.red} />
      ) : (
        <>
          <PageHeader
            kicker={getRoundKicker(round.round_number)}
            title={round.name}
            subtitle={[round.circuit, formatRoundEventDates(round)]
              .filter(Boolean)
              .join(" · ")}
          />

          {round.flyer_url ? (
            <>
              <Image
                source={{ uri: resolveMediaUrl(round.flyer_url) }}
                style={styles.flyer}
                resizeMode="contain"
                accessibilityLabel={`Flyer ${round.name}`}
              />
              {flyerBlurb ? (
                <>
                  <Text style={styles.blurb}>{flyerBlurb}</Text>
                  <PrimaryButton
                    title="Inscribite ahora"
                    onPress={() => router.push("/inscripcion")}
                    style={styles.cta}
                  />
                </>
              ) : null}
            </>
          ) : null}

          {round.map_url ? (
            <Pressable
              style={styles.link}
              onPress={() =>
                void WebBrowser.openBrowserAsync(resolveMediaUrl(round.map_url))
              }
            >
              <Text style={styles.linkText}>Ver mapa del circuito ↗</Text>
            </Pressable>
          ) : null}

          <Text style={styles.sectionTitle}>Resultados</Text>
          {results.length ? (
            results.map((r) => (
              <Pressable
                key={r.id}
                style={styles.pdf}
                onPress={() =>
                  void WebBrowser.openBrowserAsync(resolveMediaUrl(r.pdf_url))
                }
              >
                <Text style={styles.pdfText}>
                  {catMap[r.category_id]?.name ?? "?"} — {r.label}
                </Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.empty}>Sin resultados cargados.</Text>
          )}
        </>
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  flyer: {
    width: "100%",
    aspectRatio: 819 / 1024,
    backgroundColor: BRAND.colors.card,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    marginBottom: 12,
  },
  blurb: {
    color: BRAND.colors.muted,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  cta: { marginBottom: 20 },
  link: { marginBottom: 20 },
  linkText: { color: BRAND.colors.sky, fontSize: 13 },
  sectionTitle: {
    color: BRAND.colors.white,
    fontWeight: "700",
    fontSize: 14,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  pdf: {
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    backgroundColor: BRAND.colors.card,
    padding: 14,
    marginBottom: 8,
  },
  pdfText: { color: BRAND.colors.white, fontSize: 13 },
  empty: { color: BRAND.colors.muted, fontSize: 13 },
});
