import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Alert, Platform } from "react-native";

import { supabase } from "./supabase";

const PUSH_SOFT_DECLINED_KEY = "iame_push_soft_prompt_declined";
export const ANDROID_ALERTAS_CHANNEL = "alertas";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function askPushSoftPrompt(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      "Alertas del campeonato",
      "¿Querés recibir notificaciones push con avisos oficiales de BS Proyect (horarios, novedades y alertas)?",
      [
        {
          text: "Ahora no",
          style: "cancel",
          onPress: () => resolve(false),
        },
        { text: "Activar", onPress: () => resolve(true) },
      ],
    );
  });
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(ANDROID_ALERTAS_CHANNEL, {
    name: "Alertas",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    sound: "default",
    enableVibrate: true,
    showBadge: true,
  });
}

/** Permite reintentar el soft-prompt si el usuario dijo “Ahora no”. */
export async function clearPushSoftDecline(): Promise<void> {
  await AsyncStorage.removeItem(PUSH_SOFT_DECLINED_KEY);
}

export async function registerForPushNotifications(
  userId: string,
  options?: { forcePrompt?: boolean },
): Promise<string | null> {
  try {
    if (!Device.isDevice) return null;

    await ensureAndroidChannel();

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== "granted") {
      if (existing === "denied" && !options?.forcePrompt) return null;

      if (!options?.forcePrompt) {
        const declined = await AsyncStorage.getItem(PUSH_SOFT_DECLINED_KEY);
        if (declined === "1") return null;

        const wantsPush = await askPushSoftPrompt();
        if (!wantsPush) {
          await AsyncStorage.setItem(PUSH_SOFT_DECLINED_KEY, "1");
          return null;
        }
      } else {
        await AsyncStorage.removeItem(PUSH_SOFT_DECLINED_KEY);
      }

      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return null;

    // Canal otra vez por si el SO lo borró / primer arranque.
    await ensureAndroidChannel();

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenData.data;

    const { error } = await supabase.from("push_tokens").upsert(
      {
        user_id: userId,
        expo_push_token: token,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,expo_push_token" },
    );

    if (error) {
      console.warn("[push] upsert token:", error.message);
    }

    return token;
  } catch (err) {
    console.warn("[push] register failed:", err);
    return null;
  }
}

/** True si el permiso está granted y hay token guardado para este dispositivo. */
export async function isPushEnabledOnDevice(userId: string): Promise<boolean> {
  try {
    if (!Device.isDevice) return false;

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return false;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenData.data;
    if (!token) return false;

    const { data, error } = await supabase
      .from("push_tokens")
      .select("id")
      .eq("user_id", userId)
      .eq("expo_push_token", token)
      .maybeSingle();

    if (error) {
      console.warn("[push] isPushEnabledOnDevice:", error.message);
      return false;
    }
    return Boolean(data);
  } catch (err) {
    console.warn("[push] isPushEnabledOnDevice failed:", err);
    return false;
  }
}

/** Quita tokens del usuario al cerrar sesión (best-effort). */
export async function unregisterPushToken(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("push_tokens")
      .delete()
      .eq("user_id", userId);
    if (error) console.warn("[push] unregister:", error.message);
  } catch (err) {
    console.warn("[push] unregister failed:", err);
  }
}

const ALERTAS_PATH = "/(tabs)/alertas";

function notificationOpensAlertas(
  content: Notifications.NotificationContent,
): boolean {
  const data = content.data as
    | { screen?: string; url?: string }
    | undefined;
  const screen = data?.screen;
  const url = data?.url;
  if (url === ALERTAS_PATH || url === "/alertas") return true;
  // Nuestros pushes llevan screen=alertas; si falta data, igual abrimos Alertas.
  if (screen == null || screen === "") return true;
  return screen === "alertas";
}

async function consumeLastNotificationResponse(): Promise<boolean> {
  const response = await Notifications.getLastNotificationResponseAsync();
  if (!response) return false;
  const open = notificationOpensAlertas(response.notification.request.content);
  // Evita reabrir Alertas en cada cold start con la misma response.
  try {
    await Notifications.clearLastNotificationResponseAsync();
  } catch {
    // best-effort en SDKs viejos
  }
  return open;
}

/** Tap en la notificación (app en background / quit). */
export function addNotificationResponseListener(
  onNavigateToAlertas: () => void,
) {
  const sub = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      if (notificationOpensAlertas(response.notification.request.content)) {
        void Notifications.clearLastNotificationResponseAsync().catch(() => {});
        onNavigateToAlertas();
      }
    },
  );
  return () => sub.remove();
}

/**
 * Push recibido con la app en primer plano → ir a Alertas.
 * (En background iOS no permite abrir la app sola: hace falta el tap.)
 */
export function addNotificationReceivedListener(
  onNavigateToAlertas: () => void,
) {
  const sub = Notifications.addNotificationReceivedListener((notification) => {
    if (notificationOpensAlertas(notification.request.content)) {
      onNavigateToAlertas();
    }
  });
  return () => sub.remove();
}

/** App abierta desde una notificación (cold start). */
export async function getInitialNotificationRoute(): Promise<boolean> {
  return consumeLastNotificationResponse();
}

export { ALERTAS_PATH };
