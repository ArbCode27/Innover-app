import { apiClient, ApiError } from "@/lib/api-client";
import {
  devicePlatform,
  getPushTokenIfAvailable,
} from "@/features/devices/push-token";
import {
  getOrCreateDeviceId,
  loadDeviceRegistryRaw,
  saveDeviceRegistryRaw,
} from "@/lib/session-storage";
import type { AppDevice, AppDevicePlatform } from "@/types/domain";
import { Platform } from "react-native";

export const MAX_ACTIVE_DEVICES = 2;

type StoredDevice = {
  id: string;
  platform: AppDevicePlatform;
  label: string;
  lastSeenAt: string;
};

type DeviceRegistry = Record<string, StoredDevice[]>;

export type ClaimDeviceResult =
  | { ok: true; devices: AppDevice[] }
  | { ok: false; code: "DEVICE_LIMIT"; devices: AppDevice[] };

const normalizeCedula = (cedula: string) => cedula.replace(/\D/g, "");

const platformLabel = (platform: AppDevicePlatform) => {
  if (platform === "ios") {
    return "iPhone";
  }
  if (platform === "web") {
    return "Navegador";
  }
  return "Android";
};

const currentPlatform = (): AppDevicePlatform => {
  if (Platform.OS === "ios") {
    return "ios";
  }
  if (Platform.OS === "web") {
    return "web";
  }
  return "android";
};

const formatLastSeen = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Sin registro";
  }
  return date.toLocaleString("es-VE", {
    timeZone: "America/Caracas",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const parseRegistry = (raw: string | null): DeviceRegistry => {
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as DeviceRegistry;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
};

const toAppDevices = async (stored: StoredDevice[]): Promise<AppDevice[]> => {
  const currentId = await getOrCreateDeviceId();
  return stored
    .slice()
    .sort((left, right) => right.lastSeenAt.localeCompare(left.lastSeenAt))
    .map((device) => ({
      ...device,
      isCurrent: device.id === currentId,
    }));
};

const loadRegistry = async (): Promise<DeviceRegistry> => {
  return parseRegistry(await loadDeviceRegistryRaw());
};

const saveRegistry = async (registry: DeviceRegistry) => {
  await saveDeviceRegistryRaw(JSON.stringify(registry));
};

const buildCurrentDevice = async (): Promise<StoredDevice> => {
  const id = await getOrCreateDeviceId();
  const platform = currentPlatform();
  return {
    id,
    platform,
    label: `${platformLabel(platform)} · este equipo`,
    lastSeenAt: new Date().toISOString(),
  };
};

export const listSessionDevices = async (
  cedula: string | null,
): Promise<AppDevice[]> => {
  const digits = normalizeCedula(cedula ?? "");
  if (!digits) {
    return [];
  }
  const registry = await loadRegistry();
  return toAppDevices(registry[digits] ?? []);
};

export const claimSessionDevice = async (
  cedula: string | null,
): Promise<ClaimDeviceResult> => {
  const digits = normalizeCedula(cedula ?? "");
  if (!digits) {
    return { ok: true, devices: [] };
  }

  const registry = await loadRegistry();
  const current = await buildCurrentDevice();
  const existing = registry[digits] ?? [];
  const already = existing.find((device) => device.id === current.id);

  if (already) {
    const next = existing.map((device) =>
      device.id === current.id
        ? { ...device, lastSeenAt: current.lastSeenAt }
        : device,
    );
    registry[digits] = next;
    await saveRegistry(registry);
    return { ok: true, devices: await toAppDevices(next) };
  }

  if (existing.length >= MAX_ACTIVE_DEVICES) {
    return {
      ok: false,
      code: "DEVICE_LIMIT",
      devices: await toAppDevices(existing),
    };
  }

  const next = [...existing, current];
  registry[digits] = next;
  await saveRegistry(registry);
  return { ok: true, devices: await toAppDevices(next) };
};

export const revokeSessionDevice = async (
  cedula: string | null,
  deviceId: string,
): Promise<AppDevice[]> => {
  const digits = normalizeCedula(cedula ?? "");
  if (!digits) {
    return [];
  }
  const registry = await loadRegistry();
  const next = (registry[digits] ?? []).filter(
    (device) => device.id !== deviceId,
  );
  registry[digits] = next;
  await saveRegistry(registry);
  return toAppDevices(next);
};

export const revokeOldestAndClaim = async (
  cedula: string | null,
): Promise<ClaimDeviceResult> => {
  const digits = normalizeCedula(cedula ?? "");
  if (!digits) {
    return { ok: true, devices: [] };
  }

  const registry = await loadRegistry();
  const currentId = await getOrCreateDeviceId();
  const existing = (registry[digits] ?? []).filter(
    (device) => device.id !== currentId,
  );
  const sorted = existing.slice().sort((left, right) =>
    left.lastSeenAt.localeCompare(right.lastSeenAt),
  );
  const withoutOldest = sorted.slice(1);
  registry[digits] = withoutOldest;
  await saveRegistry(registry);
  return claimSessionDevice(digits);
};

/**
 * Solo para pruebas locales: llena el cupo con equipos que no son este.
 * "esto no existe en el CRM; hay que crearlo"
 */
export const seedForeignDevicesForCedula = async (
  cedula: string,
  count = MAX_ACTIVE_DEVICES,
): Promise<AppDevice[]> => {
  const digits = normalizeCedula(cedula);
  if (!digits) {
    return [];
  }
  const registry = await loadRegistry();
  const currentId = await getOrCreateDeviceId();
  const kept = (registry[digits] ?? []).filter(
    (device) => device.id === currentId,
  );
  const extras: StoredDevice[] = Array.from({ length: count }, (_, index) => ({
    id: `foreign-${digits}-${index + 1}`,
    platform: index % 2 === 0 ? "ios" : "android",
    label: index % 2 === 0 ? "iPhone · otro equipo" : "Android · otro equipo",
    lastSeenAt: new Date(Date.now() - (index + 1) * 60 * 60 * 1000).toISOString(),
  }));
  registry[digits] = [...kept, ...extras].slice(0, MAX_ACTIVE_DEVICES);
  await saveRegistry(registry);
  return toAppDevices(registry[digits]);
};

export const formatDeviceLastSeen = (iso: string) => formatLastSeen(iso);

export const registerPushIfPossible = async () => {
  const pushToken = await getPushTokenIfAvailable();
  if (!pushToken) {
    return { registered: false as const };
  }

  try {
    await apiClient.registerDevice({
      pushToken,
      platform: devicePlatform(),
    });
    return { registered: true as const };
  } catch (error) {
    if (error instanceof ApiError && error.status === 503) {
      return { registered: false as const };
    }
    throw error;
  }
};

export const handleInboundPush = (data: {
  conversationId?: string;
  preview?: string;
  direction?: string;
}) => ({
  shouldRefreshChat: data.direction === "out" || Boolean(data.conversationId),
  preview: data.preview ?? null,
});
