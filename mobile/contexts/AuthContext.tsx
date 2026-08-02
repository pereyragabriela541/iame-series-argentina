import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { InteractionManager } from "react-native";

import { deleteAccount as deleteAccountApi } from "@/lib/api";
import {
  registerForPushNotifications,
  unregisterPushToken,
} from "@/lib/push";
import { SITE_URL } from "@/lib/site";
import type { Profile } from "@/lib/types";
import { supabase } from "@/lib/supabase";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: string | null }>;
  updateProfile: (fields: {
    full_name?: string;
    phone?: string;
    avatar_url?: string;
    kart_number?: string;
    category_slug?: string;
    team?: string;
    chassis?: string;
  }) => Promise<{ error: string | null }>;
  uploadAvatar: (localUri: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.warn("[auth] fetchProfile:", error.message);
    return null;
  }
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const lastPushUserId = useRef<string | null>(null);

  const schedulePushRegistration = useCallback((userId: string) => {
    if (lastPushUserId.current === userId) return;
    lastPushUserId.current = userId;
    InteractionManager.runAfterInteractions(() => {
      void registerForPushNotifications(userId);
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    const userId = session?.user.id;
    if (!userId) {
      setProfile(null);
      return;
    }
    const p = await fetchProfile(userId);
    setProfile(p);
  }, [session?.user.id]);

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const next = data.session;
      setSession(next);
      setLoading(false);
      if (next?.user.id) {
        const p = await fetchProfile(next.user.id);
        if (!mounted) return;
        setProfile(p);
        schedulePushRegistration(next.user.id);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        // INITIAL_SESSION ya lo resolvió getSession() arriba.
        if (event === "INITIAL_SESSION") return;

        setSession(nextSession);

        if (nextSession?.user.id) {
          void (async () => {
            const p = await fetchProfile(nextSession.user.id);
            if (!mounted) return;
            setProfile(p);
            schedulePushRegistration(nextSession.user.id);
          })();
        } else {
          setProfile(null);
          lastPushUserId.current = null;
        }
      },
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [schedulePushRegistration]);

  const signIn = useCallback(async (email: string, password: string) => {
    const normalized = email.trim().toLowerCase().replace(/\s+/g, "");
    const { error } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    });
    if (!error) return { error: null };
    const msg = error.message || "";
    const lower = msg.toLowerCase();
    if (lower.includes("email not confirmed") || lower.includes("not confirmed")) {
      return {
        error:
          "El email todavía no está confirmado. Abrí el link del correo de confirmación (en el navegador) y después volvé a iniciar sesión.",
      };
    }
    if (
      lower.includes("invalid login") ||
      lower.includes("invalid credentials") ||
      lower.includes("invalid email or password")
    ) {
      return {
        error:
          "Email o contraseña incorrectos. Revisá que sea el mismo email con el que te registraste.",
      };
    }
    if (lower.includes("invalid") && lower.includes("email")) {
      return {
        error:
          "El formato del email no es válido. Probá escribirlo de nuevo sin espacios.",
      };
    }
    return { error: msg };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      const normalized = email.trim().toLowerCase().replace(/\s+/g, "");
      const { error } = await supabase.auth.signUp({
        email: normalized,
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${SITE_URL.replace(/\/$/, "")}/auth/confirmado`,
        },
      });
      return { error: error?.message ?? null };
    },
    [],
  );

  const resetPassword = useCallback(async (email: string) => {
    const normalized = email.trim().toLowerCase().replace(/\s+/g, "");
    if (!normalized) return { error: "Ingresá tu email" };
    const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
      // Destino dedicado: si va a /auth/callback sin type, se confunde con
      // confirmación de email. Agregar esta URL en Supabase → Redirect URLs.
      redirectTo: `${SITE_URL.replace(/\/$/, "")}/auth/nueva-contrasena`,
    });
    if (!error) return { error: null };
    const msg = error.message ?? "No se pudo enviar el link";
    const lower = msg.toLowerCase();
    if (lower.includes("security purposes") || lower.includes("only request")) {
      return {
        error: "Esperá unos segundos y volvé a pedir el link.",
      };
    }
    return { error: msg };
  }, []);

  const signOut = useCallback(async () => {
    const userId = session?.user.id;
    if (userId) {
      await unregisterPushToken(userId);
    }
    lastPushUserId.current = null;
    await supabase.auth.signOut();
    setProfile(null);
  }, [session?.user.id]);

  const deleteAccount = useCallback(async () => {
    const accessToken = session?.access_token;
    if (!accessToken) return { error: "No hay sesión" };

    try {
      await deleteAccountApi(accessToken);
    } catch (e) {
      return {
        error:
          e instanceof Error ? e.message : "No se pudo eliminar la cuenta",
      };
    }

    lastPushUserId.current = null;
    setProfile(null);
    await supabase.auth.signOut();
    return { error: null };
  }, [session?.access_token]);

  const updateProfile = useCallback(
    async (fields: {
      full_name?: string;
      phone?: string;
      avatar_url?: string;
      kart_number?: string;
      category_slug?: string;
      team?: string;
      chassis?: string;
    }) => {
      if (!session?.user.id) return { error: "No hay sesión" };
      const { error } = await supabase.from("profiles").upsert({
        id: session.user.id,
        ...fields,
        updated_at: new Date().toISOString(),
      });
      if (!error) await refreshProfile();
      return { error: error?.message ?? null };
    },
    [session?.user.id, refreshProfile],
  );

  const uploadAvatar = useCallback(
    async (localUri: string) => {
      if (!session?.user.id) return { error: "No hay sesión" };

      const lower = localUri.toLowerCase();
      const ext = lower.includes(".png")
        ? "png"
        : lower.includes(".webp")
          ? "webp"
          : "jpg";
      const contentType =
        ext === "png"
          ? "image/png"
          : ext === "webp"
            ? "image/webp"
            : "image/jpeg";
      const path = `${session.user.id}/avatar.${ext}`;

      try {
        const response = await fetch(localUri);
        const arrayBuffer = await response.arrayBuffer();
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, arrayBuffer, {
            contentType,
            upsert: true,
          });
        if (uploadError) return { error: uploadError.message };

        const { data: pub } = supabase.storage
          .from("avatars")
          .getPublicUrl(path);
        const avatar_url = `${pub.publicUrl}?t=${Date.now()}`;
        return updateProfile({ avatar_url });
      } catch (e) {
        return {
          error: e instanceof Error ? e.message : "No se pudo subir la foto",
        };
      }
    },
    [session?.user.id, updateProfile],
  );

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signIn,
      signUp,
      resetPassword,
      signOut,
      deleteAccount,
      updateProfile,
      uploadAvatar,
      refreshProfile,
    }),
    [
      session,
      profile,
      loading,
      signIn,
      signUp,
      resetPassword,
      signOut,
      deleteAccount,
      updateProfile,
      uploadAvatar,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
