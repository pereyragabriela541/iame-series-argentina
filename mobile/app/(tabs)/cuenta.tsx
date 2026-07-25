import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import PageHeader from "@/components/PageHeader";
import PickerField from "@/components/PickerField";
import PrimaryButton from "@/components/PrimaryButton";
import Screen from "@/components/Screen";
import TextField from "@/components/TextField";
import { useAuth } from "@/contexts/AuthContext";
import {
  getActiveSeason,
  getCategories,
  getPilotStanding,
} from "@/lib/queries";
import { BRAND } from "@/lib/theme";
import type { Category, Standing } from "@/lib/types";

function profileNeedsSetup(profile: {
  full_name: string | null;
  kart_number: string | null;
  category_slug: string | null;
} | null): boolean {
  if (!profile) return true;
  return !(
    profile.full_name?.trim() &&
    profile.kart_number?.trim() &&
    profile.category_slug?.trim()
  );
}

export default function CuentaScreen() {
  const {
    user,
    profile,
    loading,
    signOut,
    deleteAccount,
    updateProfile,
    uploadAvatar,
  } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [kartNumber, setKartNumber] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [team, setTeam] = useState("");
  const [chassis, setChassis] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [standing, setStanding] = useState<Standing | null>(null);
  const [standingLoading, setStandingLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setPhone(profile.phone ?? "");
    setKartNumber(profile.kart_number ?? "");
    setCategorySlug(profile.category_slug ?? "");
    setTeam(profile.team ?? "");
    setChassis(profile.chassis ?? "");
    if (!hydrated) {
      setEditing(profileNeedsSetup(profile));
      setHydrated(true);
    }
  }, [profile, hydrated]);

  useEffect(() => {
    void getCategories().then(setCategories);
  }, []);

  const refreshStanding = useCallback(
    async (slug: string, kart: string) => {
      if (!slug.trim() || !kart.trim()) {
        setStanding(null);
        return;
      }
      setStandingLoading(true);
      try {
        const season = await getActiveSeason();
        if (!season) {
          setStanding(null);
          return;
        }
        const row = await getPilotStanding(season.id, slug, kart);
        setStanding(row);
      } finally {
        setStandingLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!user) return;
    void refreshStanding(
      profile?.category_slug ?? "",
      profile?.kart_number ?? "",
    );
  }, [user, profile?.category_slug, profile?.kart_number, refreshStanding]);

  if (loading) {
    return (
      <Screen>
        <Text style={styles.muted}>Cargando…</Text>
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen>
        <PageHeader
          kicker="Mi cuenta"
          title="Ingresá"
          subtitle="Creá una cuenta para recibir alertas push del campeonato."
        />
        <PrimaryButton
          title="Iniciar sesión"
          onPress={() => router.push("/login")}
        />
        <PrimaryButton
          title="Crear cuenta"
          variant="secondary"
          onPress={() => router.push("/register")}
          style={styles.mt}
        />
      </Screen>
    );
  }

  function resetFromProfile() {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
    setKartNumber(profile?.kart_number ?? "");
    setCategorySlug(profile?.category_slug ?? "");
    setTeam(profile?.team ?? "");
    setChassis(profile?.chassis ?? "");
    setMessage(null);
  }

  function startEditing() {
    resetFromProfile();
    setEditing(true);
  }

  function cancelEditing() {
    resetFromProfile();
    setEditing(false);
  }

  function confirmDeleteAccount() {
    Alert.alert(
      "Eliminar cuenta",
      "Se borrará tu cuenta, perfil, foto y tokens de notificación. Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setDeleting(true);
              setMessage(null);
              const { error } = await deleteAccount();
              setDeleting(false);
              if (error) {
                setMessage(error);
                return;
              }
              router.replace("/login");
            })();
          },
        },
      ],
    );
  }

  async function handlePickPhoto() {
    if (!editing) return;
    setMessage(null);
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage("Necesitamos permiso para acceder a tus fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    });

    if (result.canceled || !result.assets[0]?.uri) return;

    setUploadingPhoto(true);
    const { error } = await uploadAvatar(result.assets[0].uri);
    setUploadingPhoto(false);
    if (error) {
      setMessage(error);
      return;
    }
    setMessage("Foto actualizada.");
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const { error } = await updateProfile({
      full_name: fullName.trim(),
      phone: phone.trim() || undefined,
      kart_number: kartNumber.trim() || undefined,
      category_slug: categorySlug.trim() || undefined,
      team: team.trim() || undefined,
      chassis: chassis.trim() || undefined,
    });
    if (error) {
      setSaving(false);
      setMessage(error);
      return;
    }
    await refreshStanding(categorySlug, kartNumber);
    setSaving(false);
    setEditing(false);
    setMessage("Perfil guardado.");
  }

  const initials = (profile?.full_name || user.email || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  const categoryItems = categories.map((c) => ({
    label: c.name,
    value: c.slug,
  }));

  const categoryLabel =
    categories.find((c) => c.slug === (profile?.category_slug ?? categorySlug))
      ?.name ??
    profile?.category_slug ??
    "—";

  const viewKart = profile?.kart_number?.trim() || "—";
  const viewPhone = profile?.phone?.trim() || "—";
  const viewTeam = profile?.team?.trim() || "—";
  const viewChassis = profile?.chassis?.trim() || "—";
  const hasLink = Boolean(
    profile?.category_slug?.trim() && profile?.kart_number?.trim(),
  );

  return (
    <Screen>
      <PageHeader
        kicker="Mi cuenta"
        title={profile?.full_name || "Piloto"}
        subtitle={user.email}
      />

      <View style={styles.avatarBlock}>
        <Pressable
          onPress={() => void handlePickPhoto()}
          disabled={!editing || uploadingPhoto}
          style={styles.avatarPress}
          accessibilityRole="button"
          accessibilityLabel={
            editing ? "Cambiar foto de perfil" : "Foto de perfil"
          }
        >
          {profile?.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.initials}>{initials || "?"}</Text>
            </View>
          )}
          {editing ? (
            <View style={styles.cameraBadge}>
              {uploadingPhoto ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="camera" size={16} color="#fff" />
              )}
            </View>
          ) : null}
        </Pressable>
        {editing ? (
          <Text style={styles.avatarHint}>
            Tocá para agregar o cambiar tu foto
          </Text>
        ) : null}
      </View>

      {!editing ? (
        <>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Con la cuenta iniciada recibís notificaciones push.
            </Text>
          </View>

          <View style={styles.viewCard}>
            <ProfileRow label="Nombre" value={profile?.full_name || "—"} />
            <ProfileRow label="Teléfono" value={viewPhone} />
            <ProfileRow label="Kart número" value={viewKart} />
            <ProfileRow label="Categoría" value={categoryLabel} />
            <ProfileRow label="Equipo" value={viewTeam} />
            <ProfileRow label="Chasis" value={viewChassis} last />
          </View>

          <ChampionshipBlock
            hasLink={hasLink}
            standingLoading={standingLoading}
            standing={standing}
          />

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <PrimaryButton title="Editar perfil" onPress={startEditing} />
          <PrimaryButton
            title="Cerrar sesión"
            variant="ghost"
            onPress={() => {
              void (async () => {
                await signOut();
                router.replace("/login");
              })();
            }}
            style={styles.mt}
          />
          <PrimaryButton
            title="Eliminar cuenta"
            variant="ghost"
            loading={deleting}
            onPress={confirmDeleteAccount}
            style={styles.mt}
          />
        </>
      ) : (
        <>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Completá kart y categoría para ver tu presentismo, posición y
              puntos del campeonato.
            </Text>
          </View>

          <TextField
            label="Nombre completo"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
          <TextField
            label="Teléfono"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <TextField
            label="Kart número"
            value={kartNumber}
            onChangeText={setKartNumber}
            keyboardType="number-pad"
          />
          <PickerField
            label="Categoría"
            value={categorySlug}
            onValueChange={setCategorySlug}
            items={categoryItems}
            placeholder="Seleccionar categoría"
          />
          <TextField
            label="Equipo"
            value={team}
            onChangeText={setTeam}
            autoCapitalize="words"
          />
          <TextField
            label="Chasis"
            value={chassis}
            onChangeText={setChassis}
            autoCapitalize="words"
          />

          <ChampionshipBlock
            hasLink={Boolean(categorySlug.trim() && kartNumber.trim())}
            standingLoading={standingLoading}
            standing={standing}
          />

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <PrimaryButton
            title="Guardar perfil"
            loading={saving}
            onPress={() => void handleSave()}
          />
          {!profileNeedsSetup(profile) ? (
            <PrimaryButton
              title="Cancelar"
              variant="ghost"
              onPress={cancelEditing}
              style={styles.mt}
            />
          ) : null}
          <PrimaryButton
            title="Cerrar sesión"
            variant="ghost"
            onPress={() => {
              void (async () => {
                await signOut();
                router.replace("/login");
              })();
            }}
            style={styles.mt}
          />
          <PrimaryButton
            title="Eliminar cuenta"
            variant="ghost"
            loading={deleting}
            onPress={confirmDeleteAccount}
            style={styles.mt}
          />
        </>
      )}
    </Screen>
  );
}

function ProfileRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, last ? null : styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function ChampionshipBlock({
  hasLink,
  standingLoading,
  standing,
}: {
  hasLink: boolean;
  standingLoading: boolean;
  standing: Standing | null;
}) {
  return (
    <View style={styles.champBlock}>
      <Text style={styles.champTitle}>Campeonato</Text>
      {!hasLink ? (
        <Text style={styles.champHint}>
          Completá kart y categoría para ver tu ranking.
        </Text>
      ) : standingLoading ? (
        <Text style={styles.champHint}>Cargando ranking…</Text>
      ) : !standing ? (
        <Text style={styles.champHint}>
          Todavía no figuran puntos para este kart/categoría.
        </Text>
      ) : (
        <View style={styles.champRow}>
          <View style={styles.champStat}>
            <Text style={styles.champLabel}>Presentismo</Text>
            <Text style={styles.champValue}>{standing.presentismo ?? 0}</Text>
          </View>
          <View style={styles.champStat}>
            <Text style={styles.champLabel}>Posición</Text>
            <Text style={styles.champValue}>{standing.position ?? "—"}</Text>
          </View>
          <View style={styles.champStat}>
            <Text style={styles.champLabel}>Puntos</Text>
            <Text style={styles.champValue}>{standing.points}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  muted: { color: BRAND.colors.muted },
  mt: { marginTop: 12 },
  avatarBlock: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarPress: {
    position: "relative",
  },
  avatar: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: BRAND.colors.card,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BRAND.colors.border,
  },
  initials: {
    color: BRAND.colors.white,
    fontSize: 40,
    fontWeight: "700",
  },
  cameraBadge: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND.colors.red,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: BRAND.colors.carbon,
  },
  avatarHint: {
    marginTop: 10,
    color: BRAND.colors.muted,
    fontSize: 13,
  },
  infoCard: {
    backgroundColor: BRAND.colors.card,
    borderLeftWidth: 4,
    borderLeftColor: BRAND.colors.sky,
    padding: 14,
    marginBottom: 20,
  },
  infoText: {
    color: BRAND.colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  viewCard: {
    backgroundColor: BRAND.colors.card,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    marginBottom: 16,
    paddingHorizontal: 14,
  },
  row: {
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BRAND.colors.border,
  },
  rowLabel: {
    color: BRAND.colors.muted,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  rowValue: {
    color: BRAND.colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
  champBlock: {
    backgroundColor: BRAND.colors.card,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    padding: 14,
    marginBottom: 16,
    marginTop: 4,
  },
  champTitle: {
    color: BRAND.colors.white,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  champHint: {
    color: BRAND.colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  champRow: {
    flexDirection: "row",
    gap: 8,
  },
  champStat: {
    flex: 1,
    alignItems: "center",
  },
  champLabel: {
    color: BRAND.colors.muted,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  champValue: {
    color: BRAND.colors.white,
    fontSize: 22,
    fontWeight: "700",
  },
  message: {
    color: BRAND.colors.sky,
    marginBottom: 12,
    fontSize: 13,
  },
});
