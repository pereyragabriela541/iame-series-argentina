import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import LegalAuthLinks from "@/components/LegalAuthLinks";
import PageHeader from "@/components/PageHeader";
import PrimaryButton from "@/components/PrimaryButton";
import Screen from "@/components/Screen";
import TextField from "@/components/TextField";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { BRAND } from "@/lib/theme";

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);

  async function handleRegister() {
    if (!fullName.trim()) {
      setError("Ingresá tu nombre");
      return;
    }
    if (!acceptedLegal) {
      setError("Debés aceptar la política de privacidad y los términos.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: err } = await signUp(email, password, fullName);
    if (err) {
      setLoading(false);
      setError(err);
      return;
    }

    // Si la sesión quedó activa (sin confirmar email), ir al inicio logueado.
    const { data } = await supabase.auth.getSession();
    setLoading(false);
    if (data.session) {
      router.replace("/");
      return;
    }

    setNeedsEmailConfirm(true);
  }

  if (needsEmailConfirm) {
    return (
      <Screen>
        <Text style={styles.success}>
          Cuenta creada. Revisá tu email para confirmarla y después iniciá
          sesión.
        </Text>
        <PrimaryButton
          title="Ir a iniciar sesión"
          onPress={() => router.replace("/login")}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader
        kicker="BS Proyect"
        title="Crear cuenta"
        subtitle="Registrate para gestionar tu perfil, foto y alertas push del campeonato."
      />
      <TextField
        label="Nombre completo"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
      />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        spellCheck={false}
      />
      <TextField
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        passwordToggle
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
      />

      <LegalAuthLinks
        requireConsent
        accepted={acceptedLegal}
        onAcceptedChange={setAcceptedLegal}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton
        title="Crear cuenta"
        loading={loading}
        onPress={() => void handleRegister()}
      />
      <PrimaryButton
        title="Ya tengo cuenta"
        variant="ghost"
        onPress={() => router.replace("/login")}
        style={styles.mt}
      />
      <PrimaryButton
        title="Continuar sin cuenta"
        variant="ghost"
        onPress={() => router.replace("/")}
        style={styles.mt}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: BRAND.colors.red, marginBottom: 12, fontSize: 13 },
  success: {
    color: BRAND.colors.sky,
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 21,
  },
  mt: { marginTop: 8 },
});
