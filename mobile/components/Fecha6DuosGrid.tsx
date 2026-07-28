import { Image, StyleSheet, Text, View } from "react-native";

import type { Fecha6Duo } from "@/lib/fecha6-duos";
import { groupFecha6DuosByCategory } from "@/lib/fecha6-duos";
import { BRAND } from "@/lib/theme";

function DuoCard({ duo }: { duo: Fecha6Duo }) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.half}>
          <Image
            source={{ uri: duo.photoTitularUrl }}
            style={styles.photo}
            resizeMode="cover"
          />
          <Text style={styles.role}>Titular</Text>
          <Text style={styles.name}>{duo.titularName}</Text>
        </View>
        <View style={styles.half}>
          <Image
            source={{ uri: duo.photoInvitadoUrl }}
            style={styles.photo}
            resizeMode="cover"
          />
          <Text style={styles.role}>Invitado</Text>
          <Text style={styles.name}>{duo.guestName}</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.cat}>{duo.categoryLabel || "Fecha 6"}</Text>
        {duo.kartNumber ? (
          <Text style={styles.kart}>#{duo.kartNumber}</Text>
        ) : null}
      </View>
    </View>
  );
}

export default function Fecha6DuosGrid({ duos }: { duos: Fecha6Duo[] }) {
  if (!duos.length) {
    return (
      <Text style={styles.empty}>
        Todavía no hay dúos publicados. Cuando se inscriban con fotos, aparecen
        acá.
      </Text>
    );
  }

  const groups = groupFecha6DuosByCategory(duos);

  return (
    <View style={styles.wrap}>
      {groups.map((group) => (
        <View
          key={group.categorySlug + group.categoryLabel}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{group.categoryLabel}</Text>
            <Text style={styles.sectionCount}>
              {group.duos.length} {group.duos.length === 1 ? "dúo" : "dúos"}
            </Text>
          </View>
          <View style={styles.grid}>
            {group.duos.map((duo) => (
              <DuoCard key={duo.id} duo={duo} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    color: BRAND.colors.muted,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    backgroundColor: BRAND.colors.card,
    paddingHorizontal: 12,
  },
  wrap: { gap: 22 },
  section: { gap: 10 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.colors.border,
    paddingBottom: 8,
  },
  sectionTitle: {
    color: BRAND.colors.white,
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionCount: {
    color: BRAND.colors.muted,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  grid: { gap: 14 },
  card: {
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    backgroundColor: BRAND.colors.card,
    overflow: "hidden",
  },
  row: { flexDirection: "row" },
  half: { flex: 1 },
  photo: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#0a0a0a",
  },
  role: {
    color: BRAND.colors.muted,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  name: {
    color: BRAND.colors.white,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: BRAND.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cat: {
    color: BRAND.colors.sky,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  kart: {
    color: BRAND.colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
});
