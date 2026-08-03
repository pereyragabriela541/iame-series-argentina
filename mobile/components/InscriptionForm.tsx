import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as WebBrowser from "expo-web-browser";

import InscriptionTurnoSection from "@/components/InscriptionTurnoSection";
import PickerField from "@/components/PickerField";
import PrimaryButton from "@/components/PrimaryButton";
import TextField from "@/components/TextField";
import { submitInscription } from "@/lib/api";
import {
  findRoundLabel,
  isDualPilotRound,
  isUuid,
  type InscriptionCategoryOption,
  type InscriptionRoundOption,
} from "@/lib/inscription-data";
import { resolveMediaUrl } from "@/lib/site";
import { BRAND } from "@/lib/theme";

const PRIVACY_URL = resolveMediaUrl("/privacidad");
const TERMS_URL = resolveMediaUrl("/terminos");

type PickedPhoto = { uri: string; name: string; type: string };

function formatBirthDateInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

function birthDateToIso(value: string): string | null {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }
  return `${year}-${month}-${day}`;
}

async function pickPhoto(): Promise<PickedPhoto | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.85,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  const uri = asset.uri;
  const ext = (uri.split(".").pop() || "jpg").toLowerCase().split("?")[0];
  const type =
    asset.mimeType ||
    (ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg");
  const name = `foto.${ext === "png" || ext === "webp" ? ext : "jpg"}`;
  return { uri, name, type };
}

function PhotoPickerField({
  label,
  photo,
  onPick,
  onClear,
}: {
  label: string;
  photo: PickedPhoto | null;
  onPick: () => void;
  onClear: () => void;
}) {
  return (
    <View style={styles.photoBlock}>
      <Text style={styles.photoLabel}>{label}</Text>
      {photo ? (
        <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
      ) : (
        <Pressable style={styles.photoEmpty} onPress={onPick}>
          <Text style={styles.photoEmptyText}>Elegir foto (JPG, PNG o WebP)</Text>
        </Pressable>
      )}
      <View style={styles.photoActions}>
        <Pressable style={styles.photoBtn} onPress={onPick}>
          <Text style={styles.photoBtnText}>
            {photo ? "Cambiar foto" : "Subir foto"}
          </Text>
        </Pressable>
        {photo ? (
          <Pressable style={styles.photoBtnDanger} onPress={onClear}>
            <Text style={styles.photoBtnDangerText}>Quitar foto</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

interface ConfirmedRegistration {
  registrationId: string;
  roundKey: string;
  roundLabel: string;
  dni: string;
  email: string;
  fullName: string;
}

interface InscriptionFormProps {
  rounds: InscriptionRoundOption[];
  categories: InscriptionCategoryOption[];
  enabled: boolean;
}

export default function InscriptionForm({
  rounds,
  categories,
  enabled,
}: InscriptionFormProps) {
  const [roundKey, setRoundKey] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [fullName, setFullName] = useState("");
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [guestFullName, setGuestFullName] = useState("");
  const [guestDni, setGuestDni] = useState("");
  const [guestBirthDate, setGuestBirthDate] = useState("");
  const [photoTitular, setPhotoTitular] = useState<PickedPhoto | null>(null);
  const [photoInvitado, setPhotoInvitado] = useState<PickedPhoto | null>(null);
  const [kartNumber, setKartNumber] = useState("");
  const [team, setTeam] = useState("");
  const [city, setCity] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [confirmed, setConfirmed] = useState<ConfirmedRegistration | null>(null);

  const dualPilot = isDualPilotRound(roundKey);

  if (!enabled) {
    return (
      <Text style={styles.disabled}>
        Las inscripciones no están habilitadas en este momento.
      </Text>
    );
  }

  async function handleSubmit() {
    if (!privacy) {
      setStatus("error");
      setMessage("Debés aceptar la política de privacidad.");
      return;
    }
    if (!roundKey || !categorySlug) {
      setStatus("error");
      setMessage("Seleccioná fecha y categoría.");
      return;
    }
    if (birthDate && !birthDateToIso(birthDate)) {
      setStatus("error");
      setMessage(
        dualPilot
          ? "Fecha de nacimiento del titular inválida. Usá DD-MM-AAAA."
          : "Fecha de nacimiento inválida. Usá el formato DD-MM-AAAA.",
      );
      return;
    }
    if (dualPilot) {
      if (!fullName.trim() || !dni.trim() || !birthDateToIso(birthDate)) {
        setStatus("error");
        setMessage("Completá nombre, DNI y fecha de nacimiento del titular.");
        return;
      }
      if (
        !guestFullName.trim() ||
        !guestDni.trim() ||
        !birthDateToIso(guestBirthDate)
      ) {
        setStatus("error");
        setMessage("Completá nombre, DNI y fecha de nacimiento del invitado.");
        return;
      }
      if (!photoTitular || !photoInvitado) {
        setStatus("error");
        setMessage("Subí la foto del titular y del invitado.");
        return;
      }
    }

    setLoading(true);
    setMessage("");
    const roundOption = rounds.find((r) => r.value === roundKey);
    const categoryLabel =
      categories.find((c) => c.value === categorySlug)?.label ?? categorySlug;
    const roundLabel = findRoundLabel(roundKey, rounds);
    const roundIdUuid =
      roundOption?.roundId ?? (isUuid(roundKey) ? roundKey : null);

    const body = {
      round_key: roundKey,
      round_id_uuid: roundIdUuid,
      round_label: roundLabel,
      category_slug: categorySlug,
      category_label: categoryLabel,
      full_name: fullName.trim(),
      dni: dni.trim(),
      email: email.trim(),
      phone: phone.trim(),
      birth_date: birthDate ? birthDateToIso(birthDate) : null,
      kart_number: kartNumber.trim(),
      team: team.trim(),
      city: city.trim(),
      privacy_consent: true,
      ...(dualPilot
        ? {
            guest_full_name: guestFullName.trim(),
            guest_dni: guestDni.trim(),
            guest_birth_date: birthDateToIso(guestBirthDate),
            photo_titular: photoTitular,
            photo_invitado: photoInvitado,
          }
        : {}),
    };

    try {
      const data = await submitInscription(body);
      setStatus("ok");
      setMessage(
        "Tu inscripción aún no está completa. Para confirmarla, debés reservar tu turno y finalizar el trámite de manera presencial.",
      );
      setConfirmed({
        registrationId: data.registrationId,
        roundKey,
        roundLabel,
        dni: body.dni,
        email: body.email,
        fullName: body.full_name,
      });
    } catch (e) {
      const err = e as Error & {
        status?: number;
        data?: { registrationId?: string; alreadyRegistered?: boolean };
      };
      if (err.status === 409 && err.data?.registrationId) {
        setConfirmed({
          registrationId: err.data.registrationId,
          roundKey,
          roundLabel,
          dni: body.dni,
          email: body.email,
          fullName: body.full_name,
        });
      }
      setStatus("error");
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.step}>Paso 1 — Inscripción</Text>

      <PickerField
        label="Fecha"
        value={roundKey}
        onValueChange={setRoundKey}
        items={rounds.map((r) => ({ label: r.label, value: r.value }))}
        placeholder="Seleccionar fecha"
      />

      {dualPilot ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Fecha 6 es de dos pilotos (titular e invitado). Completá los datos
            de ambos y subí una foto de cada uno. Los dúos se publican en
            Noticias.
          </Text>
        </View>
      ) : null}

      <PickerField
        label="Categoría"
        value={categorySlug}
        onValueChange={setCategorySlug}
        items={categories.map((c) => ({ label: c.label, value: c.value }))}
        placeholder="Seleccionar categoría"
      />
      <TextField
        label="Número de kart"
        value={kartNumber}
        onChangeText={setKartNumber}
        keyboardType="number-pad"
      />

      <Text style={styles.sectionLabel}>
        {dualPilot ? "Piloto titular" : "Datos del piloto"}
      </Text>
      <TextField
        label={dualPilot ? "Nombre completo del titular" : "Nombre completo"}
        value={fullName}
        onChangeText={setFullName}
      />
      <TextField
        label={dualPilot ? "DNI del titular" : "DNI"}
        value={dni}
        onChangeText={setDni}
        keyboardType="number-pad"
      />
      <TextField
        label={
          dualPilot
            ? "Nacimiento del titular (DD-MM-AAAA)"
            : "Fecha de nacimiento (DD-MM-AAAA)"
        }
        value={birthDate}
        onChangeText={(value) => setBirthDate(formatBirthDateInput(value))}
        keyboardType="number-pad"
        placeholder="DD-MM-AAAA"
      />
      {dualPilot ? (
        <PhotoPickerField
          label="Foto del titular *"
          photo={photoTitular}
          onPick={() => {
            void pickPhoto().then((p) => {
              if (p) setPhotoTitular(p);
            });
          }}
          onClear={() => setPhotoTitular(null)}
        />
      ) : null}

      {dualPilot ? (
        <>
          <Text style={styles.sectionLabel}>Piloto invitado</Text>
          <TextField
            label="Nombre completo del invitado"
            value={guestFullName}
            onChangeText={setGuestFullName}
          />
          <TextField
            label="DNI del invitado"
            value={guestDni}
            onChangeText={setGuestDni}
            keyboardType="number-pad"
          />
          <TextField
            label="Nacimiento del invitado (DD-MM-AAAA)"
            value={guestBirthDate}
            onChangeText={(value) =>
              setGuestBirthDate(formatBirthDateInput(value))
            }
            keyboardType="number-pad"
            placeholder="DD-MM-AAAA"
          />
          <PhotoPickerField
            label="Foto del invitado *"
            photo={photoInvitado}
            onPick={() => {
              void pickPhoto().then((p) => {
                if (p) setPhotoInvitado(p);
              });
            }}
            onClear={() => setPhotoInvitado(null)}
          />
        </>
      ) : null}

      <TextField
        label={dualPilot ? "Email del titular" : "Email"}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextField
        label={dualPilot ? "Teléfono (solo titular)" : "Teléfono"}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextField
        label={
          dualPilot ? "Equipo / Escudería (solo titular)" : "Equipo / Escudería"
        }
        value={team}
        onChangeText={setTeam}
      />
      <TextField
        label={dualPilot ? "Ciudad (solo titular)" : "Ciudad"}
        value={city}
        onChangeText={setCity}
      />

      <Pressable style={styles.checkRow} onPress={() => setPrivacy((p) => !p)}>
        <View style={[styles.checkbox, privacy && styles.checkboxOn]} />
        <Text style={styles.checkText}>
          Autorizo a BS Proyect al tratamiento de mis
          datos personales (y, si corresponde, del piloto invitado y de las
          fotografías cargadas, inclusive su publicación en Noticias) conforme
          a la{" "}
          <Text
            style={styles.checkLink}
            onPress={() => void WebBrowser.openBrowserAsync(PRIVACY_URL)}
          >
            política de privacidad
          </Text>{" "}
          y los{" "}
          <Text
            style={styles.checkLink}
            onPress={() => void WebBrowser.openBrowserAsync(TERMS_URL)}
          >
            términos y condiciones
          </Text>
          .
        </Text>
      </Pressable>

      {message ? (
        <Text style={[styles.msg, status === "ok" ? styles.msgOk : styles.msgErr]}>
          {message}
        </Text>
      ) : null}

      <PrimaryButton
        title="Enviar inscripción"
        loading={loading}
        onPress={() => void handleSubmit()}
      />

      {confirmed ? <InscriptionTurnoSection registration={confirmed} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    backgroundColor: "rgba(23,23,23,0.5)",
    padding: 16,
  },
  step: {
    color: BRAND.colors.red,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  sectionLabel: {
    color: BRAND.colors.sky,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 8,
    marginBottom: 4,
  },
  notice: {
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    backgroundColor: BRAND.colors.card,
    padding: 12,
    marginBottom: 8,
  },
  noticeText: {
    color: BRAND.colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  photoBlock: { marginBottom: 12 },
  photoLabel: {
    color: BRAND.colors.muted,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  photoPreview: {
    width: 160,
    height: 160,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    backgroundColor: "#0a0a0a",
  },
  photoEmpty: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: BRAND.colors.border,
    paddingVertical: 28,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  photoEmptyText: { color: BRAND.colors.muted, fontSize: 12 },
  photoActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  photoBtn: {
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  photoBtnText: {
    color: BRAND.colors.muted,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  photoBtnDanger: {
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  photoBtnDangerText: {
    color: BRAND.colors.red,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  disabled: {
    color: BRAND.colors.muted,
    textAlign: "center",
    padding: 24,
  },
  checkRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    marginTop: 8,
    marginBottom: 12,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    marginTop: 2,
  },
  checkboxOn: { backgroundColor: BRAND.colors.red },
  checkText: { flex: 1, color: BRAND.colors.muted, fontSize: 12, lineHeight: 18 },
  checkLink: { color: BRAND.colors.sky },
  msg: { fontSize: 13, marginBottom: 12 },
  msgOk: { color: "#4ade80" },
  msgErr: { color: BRAND.colors.red },
});
