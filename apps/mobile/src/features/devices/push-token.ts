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

/**
 * Stub: no hay claves FCM/APNs en este build.
 * Cuando existan, este módulo pide permiso y devuelve el token nativo.
 */
export const getPushTokenIfAvailable = async (): Promise<string | null> => {
  return null;
};
