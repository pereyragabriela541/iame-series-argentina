import { HeaderBackButton } from "@react-navigation/elements";
import { useCallback, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { router, Stack, useFocusEffect } from "expo-router";

import EmptyState from "@/components/EmptyState";
import Fecha6DuosGrid from "@/components/Fecha6DuosGrid";
import NewsCard from "@/components/NewsCard";
import PageHeader from "@/components/PageHeader";
import Screen from "@/components/Screen";
import { fetchFecha6Duos } from "@/lib/api";
import type { Fecha6Duo } from "@/lib/fecha6-duos";
import { getNews } from "@/lib/queries";
import { BRAND } from "@/lib/theme";
import type { NewsArticle } from "@/lib/types";

export default function NoticiasScreen() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [duos, setDuos] = useState<Fecha6Duo[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void Promise.all([
        getNews(),
        fetchFecha6Duos()
          .then((r) => r.duos)
          .catch(() => [] as Fecha6Duo[]),
      ])
        .then(([n, d]) => {
          setNews(n.filter((item) => item.slug !== "duos-fecha-6"));
          setDuos(d);
        })
        .finally(() => setLoading(false));
    }, []),
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "Noticias",
          headerBackTitle: "Volver",
          headerLeft: () => (
            <HeaderBackButton
              tintColor={BRAND.colors.white}
              label="Volver"
              labelStyle={{ fontSize: 13 }}
              onPress={() => router.back()}
            />
          ),
        }}
      />
      <Screen>
        <PageHeader
          kicker="Novedades"
          title="Noticias"
          subtitle="Comunicados oficiales del campeonato"
        />
        {loading ? (
          <ActivityIndicator color={BRAND.colors.red} />
        ) : (
          <View style={{ gap: 20 }}>
            <View
              style={{
                borderWidth: 1,
                borderColor: BRAND.colors.border,
                backgroundColor: BRAND.colors.card,
                padding: 14,
                gap: 12,
              }}
            >
              <Text
                style={{
                  color: BRAND.colors.red,
                  fontSize: 10,
                  fontWeight: "700",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                Fecha 6
              </Text>
              <Text
                style={{
                  color: BRAND.colors.white,
                  fontSize: 17,
                  fontWeight: "700",
                  textTransform: "uppercase",
                }}
              >
                Dúos inscriptos
              </Text>
              <Fecha6DuosGrid duos={duos} />
            </View>

            {news.length ? (
              <View>
                {news.map((n) => (
                  <NewsCard key={n.id} article={n} />
                ))}
              </View>
            ) : !duos.length ? (
              <EmptyState message="No hay noticias publicadas." />
            ) : null}
          </View>
        )}
      </Screen>
    </>
  );
}
