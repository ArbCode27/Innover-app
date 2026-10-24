import type { AppChannelSession, AppRealtimeSession } from "@/types/app-channel";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "innover.app.token";
const SESSION_KEY = "innover.app.session";
const REALTIME_KEY = "innover.app.realtime";
const BIOMETRIC_SESSION_KEY = "innover.app.biometric.session";
const BIOMETRIC_CEDULA_KEY = "innover.app.biometric.cedula";
const BIOMETRICS_ENABLED_KEY = "innover.app.biometrics.enabled";
const DEVICE_ID_KEY = "innover.app.device-id";
const DEVICE_REGISTRY_KEY = "innover.app.devices.registry";

const memoryStore = new Map<string, string>();

const setSecureItem = async (key: string, value: string) => {
  if (Platform.OS === "web") {
    memoryStore.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
};

const getSecureItem = async (key: string) => {
  if (Platform.OS === "web") {
    return memoryStore.get(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
};

const deleteSecureItem = async (key: string) => {
  if (Platform.OS === "web") {
    memoryStore.delete(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
};

const isRealtimeSession = (value: unknown): value is AppRealtimeSession => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Partial<AppRealtimeSession>;
  return (
    typeof row.url === "string" &&
    typeof row.anonKey === "string" &&
    typeof row.accessToken === "string" &&
    typeof row.expiresAt === "number" &&
    typeof row.conversationId === "number"
  );
};

const parseSession = (raw: string | null): AppChannelSession | null => {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as AppChannelSession;
    if (!parsed.token || !parsed.organization) {
      return null;
    }
    const role =
      parsed.role ||
      (parsed.technician ? "technician" : "customer");
    if (role === "customer" && !parsed.client) {
      return null;
    }
    if (
      (role === "technician" || role === "supervisor") &&
      !parsed.technician
    ) {
      return null;
    }
    return {
      ...parsed,
      role,
      client: parsed.client ?? null,
      technician: parsed.technician ?? null,
      conversation: parsed.conversation ?? null,
      realtime: isRealtimeSession(parsed.realtime) ? parsed.realtime : null,
    };
  } catch {
    return null;
  }
};

const parseRealtime = (raw: string | null): AppRealtimeSession | null => {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return isRealtimeSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const persistRealtime = async (realtime: AppRealtimeSession | null) => {
  if (!realtime) {
    await deleteSecureItem(REALTIME_KEY);
    return;
  }
  try {
    await setSecureItem(REALTIME_KEY, JSON.stringify(realtime));
  } catch {
    await deleteSecureItem(REALTIME_KEY);
  }
};

export const saveSession = async (session: AppChannelSession) => {
  await setSecureItem(TOKEN_KEY, session.token);
  await setSecureItem(
    SESSION_KEY,
    JSON.stringify({
      token: session.token,
      role: session.role,
      organization: session.organization,
      client: session.client,
      technician: session.technician,
      conversation: session.conversation,
    }),
  );
  await persistRealtime(session.realtime);
};

export const loadSession = async (): Promise<AppChannelSession | null> => {
  const parsed = parseSession(await getSecureItem(SESSION_KEY));
  if (!parsed) {
    return null;
  }
  const realtime = parseRealtime(await getSecureItem(REALTIME_KEY));
  return { ...parsed, realtime };
};

export const loadAccessToken = async (): Promise<string | null> => {
  return getSecureItem(TOKEN_KEY);
};

export const clearSession = async () => {
  await deleteSecureItem(TOKEN_KEY);
  await deleteSecureItem(SESSION_KEY);
  await deleteSecureItem(REALTIME_KEY);
};

export const saveBiometricSession = async (session: AppChannelSession) => {
  const cedula =
    session.client?.cedula || session.technician?.document || null;
  if (cedula) {
    await setSecureItem(BIOMETRIC_CEDULA_KEY, cedula);
  }
  await setSecureItem(BIOMETRICS_ENABLED_KEY, "1");
  await setSecureItem(
    BIOMETRIC_SESSION_KEY,
    JSON.stringify({
      token: session.token,
      role: session.role,
      organization: session.organization,
      client: session.client,
      technician: session.technician,
      conversation: session.conversation,
    }),
  );
};

export const loadBiometricSession = async (): Promise<AppChannelSession | null> => {
  const parsed = parseSession(await getSecureItem(BIOMETRIC_SESSION_KEY));
  if (!parsed) {
    return null;
  }
  const realtime = parseRealtime(await getSecureItem(REALTIME_KEY));
  return { ...parsed, realtime };
};

export const loadBiometricCedula = async (): Promise<string | null> => {
  return getSecureItem(BIOMETRIC_CEDULA_KEY);
};

export const loadBiometricsEnabled = async (): Promise<boolean> => {
  return (await getSecureItem(BIOMETRICS_ENABLED_KEY)) === "1";
};

export const clearBiometricSession = async () => {
  await deleteSecureItem(BIOMETRIC_SESSION_KEY);
  await deleteSecureItem(BIOMETRIC_CEDULA_KEY);
  await deleteSecureItem(BIOMETRICS_ENABLED_KEY);
};

const createDeviceId = () =>
  `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const getOrCreateDeviceId = async (): Promise<string> => {
  const stored = await getSecureItem(DEVICE_ID_KEY);
  if (stored) {
    return stored;
  }
  const next = createDeviceId();
  await setSecureItem(DEVICE_ID_KEY, next);
  return next;
};

export const loadDeviceRegistryRaw = async (): Promise<string | null> => {
  return getSecureItem(DEVICE_REGISTRY_KEY);
};

export const saveDeviceRegistryRaw = async (value: string) => {
  await setSecureItem(DEVICE_REGISTRY_KEY, value);
};
