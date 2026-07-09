import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { formatDate } from "@/lib/queries";
import { resolveMediaUrl } from "@/lib/site";
import { BRAND } from "@/lib/theme";
import type { NewsArticle } from "@/lib/types";

export default function NewsCard({ article }: { article: NewsArticle }) {
  const href = article.slug
    ? `/noticias/${article.slug}`
    : `/noticias/${article.id}`;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => router.push(href as `/noticias/${string}`)}
    >
      {article.image_url ? (
        <Image
          source={{ uri: resolveMediaUrl(article.image_url) }}
          style={styles.image}
          resizeMode="contain"
        />
      ) : null}
      <View style={styles.body}>
        <Text style={styles.category}>{article.category ?? "General"}</Text>
        <Text style={styles.title}>{article.title}</Text>
        {article.excerpt ? (
          <Text style={styles.excerpt} numberOfLines={2}>
            {article.excerpt}
          </Text>
        ) : null}
        <Text style={styles.date}>{formatDate(article.published_at)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    backgroundColor: BRAND.colors.card,
    marginBottom: 12,
    overflow: "hidden",
  },
  pressed: { opacity: 0.9 },
  image: { width: "100%", height: 200, backgroundColor: BRAND.colors.navy },
  body: { padding: 14 },
  category: {
    color: BRAND.colors.red,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  title: {
    color: BRAND.colors.white,
    fontWeight: "700",
    fontSize: 14,
    textTransform: "uppercase",
    marginTop: 4,
  },
  excerpt: { color: BRAND.colors.muted, fontSize: 12, marginTop: 6, lineHeight: 18 },
  date: {
    color: "#525252",
    fontSize: 10,
    marginTop: 10,
    fontFamily: "SpaceMono",
  },
});
