import { isRunningInExpoGo } from "expo";
import { Platform } from "react-native";

export type PushPlatform = "android" | "ios" | "web";

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

export const getPushTokenIfAvailable = async (): Promise<string | null> => {
  if (!canUseNativeNotifications()) {
    return null;
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
      return null;
    }

    if (Platform.OS === "android") {
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
    }

    const token = await Notifications.getExpoPushTokenAsync();
    return token.data || null;
  } catch {
    return null;
  }
};
