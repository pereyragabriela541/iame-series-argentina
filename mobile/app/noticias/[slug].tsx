import { useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";

import Fecha6DuosGrid from "@/components/Fecha6DuosGrid";
import PageHeader from "@/components/PageHeader";
import Screen from "@/components/Screen";
import { fetchFecha6Duos } from "@/lib/api";
import type { Fecha6Duo } from "@/lib/fecha6-duos";
import { formatDate, getNews, getNewsBySlug } from "@/lib/queries";
import { resolveMediaUrl } from "@/lib/site";
import { BRAND } from "@/lib/theme";
import type { NewsArticle } from "@/lib/types";

export default function NoticiaDetalleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [duos, setDuos] = useState<Fecha6Duo[]>([]);
  const [loading, setLoading] = useState(true);
  const isDuos = slug === "duos-fecha-6";

  useFocusEffect(
    useCallback(() => {
      if (!slug) return;
      setLoading(true);
      void (async () => {
        let data = await getNewsBySlug(slug).catch(() => null);
        if (!data) {
          const all = await getNews(100);
          data = all.find((n) => n.id === slug) ?? null;
        }
        setArticle(data);
        if (slug === "duos-fecha-6") {
          const res = await fetchFecha6Duos().catch(() => ({ duos: [] }));
          setDuos(res.duos);
        } else {
          setDuos([]);
        }
        setLoading(false);
      })();
    }, [slug]),
  );

  return (
    <Screen>
      {loading || !article ? (
        <ActivityIndicator color={BRAND.colors.red} style={styles.loader} />
      ) : (
        <>
          <PageHeader
            kicker={article.category || undefined}
            title={article.title}
            subtitle={
              article.image_url || isDuos
                ? undefined
                : formatDate(article.published_at)
            }
          />
          {article.image_url && !isDuos ? (
            <Image
              source={{ uri: resolveMediaUrl(article.image_url) }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : null}
          {article.body || article.excerpt ? (
            <Text style={styles.body}>{article.body ?? article.excerpt}</Text>
          ) : null}
          {isDuos ? (
            <View style={styles.duosWrap}>
              <Text style={styles.duosTitle}>
                Dúos publicados ({duos.length})
              </Text>
              <Fecha6DuosGrid duos={duos} />
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 40 },
  image: {
    width: "100%",
    height: 240,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    backgroundColor: BRAND.colors.navy,
  },
  body: {
    color: BRAND.colors.muted,
    fontSize: 14,
    lineHeight: 22,
  },
  duosWrap: { marginTop: 16, gap: 12 },
  duosTitle: {
    color: BRAND.colors.white,
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
