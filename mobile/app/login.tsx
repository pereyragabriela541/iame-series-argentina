import { router } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import LegalAuthLinks from "@/components/LegalAuthLinks";
import PageHeader from "@/components/PageHeader";
import PrimaryButton from "@/components/PrimaryButton";
import Screen from "@/components/Screen";
import TextField from "@/components/TextField";
import { useAuth } from "@/contexts/AuthContext";
import { BRAND } from "@/lib/theme";

const SUPPORT_PHONE = "+5491122948728";
const SUPPORT_TEL = `tel:${SUPPORT_PHONE}`;

export default function LoginScreen() {
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoverMessage, setRecoverMessage] = useState<string | null>(null);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    setRecoverMessage(null);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    router.replace("/");
  }

  async function handleForgotPassword() {
    setRecovering(true);
    setError(null);
    setRecoverMessage(null);
    const { error: err } = await resetPassword(email);
    setRecovering(false);
    if (err) {
      setError(err);
      return;
    }
    setRecoverMessage(
      "Te enviamos un link a tu email para elegir una contraseña nueva. Revisá también spam.",
    );
  }

  return (
    <Screen>
      <PageHeader
        kicker="BS Proyect"
        title="Ingresá"
        subtitle="Iniciá sesión para tu cuenta, alertas push y foto de perfil. El resto de la app se puede usar sin cuenta."
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
        autoComplete="password"
        textContentType="password"
      />
      <LegalAuthLinks />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {recoverMessage ? (
        <Text style={styles.recoverOk}>{recoverMessage}</Text>
      ) : null}
      <PrimaryButton
        title="Entrar"
        loading={loading}
        onPress={() => void handleLogin()}
      />

      <View style={styles.authLinks}>
        <Pressable
          onPress={() => void handleForgotPassword()}
          disabled={recovering}
          accessibilityRole="button"
        >
          <Text style={styles.authLinkStrong}>
            {recovering ? "Enviando link…" : "¿Olvidaste la contraseña?"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.replace("/register")}
          accessibilityRole="link"
        >
          <Text style={styles.authLinkText}>
            ¿No tenés cuenta?{" "}
            <Text style={styles.authLinkStrong}>Registrate</Text>
          </Text>
        </Pressable>
        <Pressable
          onPress={() => void Linking.openURL(SUPPORT_TEL)}
          accessibilityRole="link"
          accessibilityLabel={`Ayuda técnica ${SUPPORT_PHONE}`}
        >
          <Text style={styles.supportText}>
            Ayuda técnica: {SUPPORT_PHONE}
          </Text>
        </Pressable>
      </View>

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
  recoverOk: {
    color: BRAND.colors.sky,
    marginBottom: 12,
    fontSize: 13,
    lineHeight: 18,
  },
  mt: { marginTop: 8 },
  authLinks: {
    marginTop: 20,
    alignItems: "center",
    gap: 12,
  },
  authLinkText: {
    color: BRAND.colors.silver,
    fontSize: 14,
    textAlign: "center",
  },
  authLinkStrong: {
    color: BRAND.colors.white,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  supportText: {
    color: BRAND.colors.muted,
    fontSize: 12,
    textAlign: "center",
  },
});
