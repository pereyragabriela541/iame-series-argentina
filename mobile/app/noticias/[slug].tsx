import { useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
} from "react-native";
import { useFocusEffect } from "expo-router";

import PageHeader from "@/components/PageHeader";
import Screen from "@/components/Screen";
import { formatDate, getNews, getNewsBySlug } from "@/lib/queries";
import { resolveMediaUrl } from "@/lib/site";
import { BRAND } from "@/lib/theme";
import type { NewsArticle } from "@/lib/types";

export default function NoticiaDetalleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);

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
            kicker={article.category ?? "General"}
            title={article.title}
            subtitle={formatDate(article.published_at)}
          />
          {article.image_url ? (
            <Image
              source={{ uri: resolveMediaUrl(article.image_url) }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : null}
          <Text style={styles.body}>{article.body ?? article.excerpt}</Text>
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
});
