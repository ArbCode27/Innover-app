import type { AppChannelSession } from "@/types/app-channel";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "innover.app.token";
const SESSION_KEY = "innover.app.session";
const BIOMETRIC_SESSION_KEY = "innover.app.biometric.session";
const BIOMETRIC_CEDULA_KEY = "innover.app.biometric.cedula";

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

const parseSession = (raw: string | null): AppChannelSession | null => {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as AppChannelSession;
    if (!parsed.token || !parsed.client || !parsed.conversation) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const saveSession = async (session: AppChannelSession) => {
  await setSecureItem(TOKEN_KEY, session.token);
  await setSecureItem(
    SESSION_KEY,
    JSON.stringify({
      token: session.token,
      organization: session.organization,
      client: session.client,
      conversation: session.conversation,
    }),
  );
};

export const loadSession = async (): Promise<AppChannelSession | null> => {
  const raw = await getSecureItem(SESSION_KEY);
  return parseSession(raw);
};

export const loadAccessToken = async (): Promise<string | null> => {
  return getSecureItem(TOKEN_KEY);
};

export const clearSession = async () => {
  await deleteSecureItem(TOKEN_KEY);
  await deleteSecureItem(SESSION_KEY);
};

export const saveBiometricSession = async (session: AppChannelSession) => {
  if (session.client.cedula) {
    await setSecureItem(BIOMETRIC_CEDULA_KEY, session.client.cedula);
  }
  await setSecureItem(BIOMETRIC_SESSION_KEY, JSON.stringify(session));
};

export const loadBiometricSession = async (): Promise<AppChannelSession | null> => {
  const raw = await getSecureItem(BIOMETRIC_SESSION_KEY);
  return parseSession(raw);
};

export const loadBiometricCedula = async (): Promise<string | null> => {
  return getSecureItem(BIOMETRIC_CEDULA_KEY);
};

export const clearBiometricSession = async () => {
  await deleteSecureItem(BIOMETRIC_SESSION_KEY);
  await deleteSecureItem(BIOMETRIC_CEDULA_KEY);
};
