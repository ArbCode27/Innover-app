import Constants from "expo-constants";
import { isRunningInExpoGo } from "expo";
import { Platform } from "react-native";

export type PushPlatform = "android" | "ios" | "web";

export type PushTokenFailureReason =
  | "expo_go"
  | "web"
  | "permission_denied"
  | "project_id_missing"
  | "token_error";

export type PushTokenResult =
  | { ok: true; token: string }
  | { ok: false; reason: PushTokenFailureReason; detail?: string };

/** Visible también en APK release (Logcat: ReactNativeJS). */
const logPush = (...args: unknown[]) => {
  console.warn("[push]", ...args);
};

/** Evita spam en Expo Go (register se reintenta con la sesión). */
let loggedExpoGoSkip = false;

export const devicePlatform = (): PushPlatform => {
  if (Platform.OS === "ios") {
    return "ios";
  }
  if (Platform.OS === "web") {
    return "web";
  }
  return "android";
};

export const canUseNativeNotifications = () =>
  Platform.OS !== "web" && !isRunningInExpoGo();

export const resolveExpoProjectId = (): string | null => {
  const fromEas = Constants.easConfig?.projectId;
  if (typeof fromEas === "string" && fromEas.trim()) {
    return fromEas.trim();
  }
  const fromExtra = Constants.expoConfig?.extra?.eas;
  if (fromExtra && typeof fromExtra === "object") {
    const projectId = (fromExtra as { projectId?: unknown }).projectId;
    if (typeof projectId === "string" && projectId.trim()) {
      return projectId.trim();
    }
  }
  return null;
};

const ensureAndroidChannels = async (
  Notifications: typeof import("expo-notifications"),
) => {
  if (Platform.OS !== "android") {
    return;
  }
  await Notifications.setNotificationChannelAsync("innover-info", {
    name: "Star Conectados",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  await Notifications.setNotificationChannelAsync("star-chat", {
    name: "Mensajes",
    importance: Notifications.AndroidImportance.HIGH,
  });
  await Notifications.setNotificationChannelAsync("star-ticket", {
    name: "Visitas técnicas",
    importance: Notifications.AndroidImportance.HIGH,
  });
};

export const getPushTokenIfAvailable = async (): Promise<string | null> => {
  const result = await resolvePushToken();
  return result.ok ? result.token : null;
};

export const resolvePushToken = async (): Promise<PushTokenResult> => {
  if (Platform.OS === "web") {
    logPush("skip", "web");
    return { ok: false, reason: "web" };
  }
  if (isRunningInExpoGo()) {
    if (!loggedExpoGoSkip) {
      loggedExpoGoSkip = true;
      logPush("skip", "expo_go");
    }
    return { ok: false, reason: "expo_go" };
  }

  const projectId = resolveExpoProjectId();
  if (!projectId) {
    logPush("fail", "project_id_missing");
    return { ok: false, reason: "project_id_missing" };
  }

  try {
    const Notifications = await import("expo-notifications");
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      const asked = await Notifications.requestPermissionsAsync();
      status = asked.status;
    }
    if (status !== "granted") {
      logPush("fail", "permission_denied", status);
      return { ok: false, reason: "permission_denied", detail: status };
    }

    await ensureAndroidChannels(Notifications);

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    const value = token.data?.trim() || "";
    if (!value) {
      logPush("fail", "token_error", "empty token");
      return { ok: false, reason: "token_error", detail: "empty token" };
    }

    logPush("token", `${value.slice(0, 28)}…`, "projectId", projectId);
    return { ok: true, token: value };
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "unknown token error";
    logPush("fail", "token_error", detail);
    return { ok: false, reason: "token_error", detail };
  }
};
