import { apiClient, ApiError } from "@/lib/api-client";
import {
  devicePlatform,
  resolvePushToken,
  type PushTokenFailureReason,
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

export type RegisterPushReason =
  | PushTokenFailureReason
  | "http_error"
  | "network"
  | "ok";

export type RegisterPushResult =
  | { registered: true; reason: "ok"; tokenPreview: string }
  | { registered: false; reason: RegisterPushReason; detail?: string };

const PUSH_REGISTER_ATTEMPTS = 3;
const PUSH_REGISTER_BACKOFF_MS = [800, 2000, 4000] as const;

/** Visible también en APK release (Logcat: ReactNativeJS). */
const logPushRegister = (...args: unknown[]) => {
  console.warn("[push:register]", ...args);
};

export const describePushRegisterResult = (
  result: RegisterPushResult,
): { title: string; body: string } => {
  if (result.registered) {
    return {
      title: "Avisos listos",
      body: `Token registrado en el servidor (${result.tokenPreview}).`,
    };
  }

  switch (result.reason) {
    case "expo_go":
      return {
        title: "Avisos no disponibles",
        body: "Expo Go no registra push. Usa el APK de EAS.",
      };
    case "web":
      return {
        title: "Avisos no disponibles",
        body: "Las notificaciones solo funcionan en Android o iOS.",
      };
    case "permission_denied":
      return {
        title: "Permiso de avisos denegado",
        body: "Activa notificaciones para Star Conectados en Ajustes del teléfono y vuelve a entrar.",
      };
    case "project_id_missing":
      return {
        title: "Push mal configurado",
        body: "Falta eas.projectId en el build. Hay que regenerar el APK.",
      };
    case "token_error":
      return {
        title: "No se pudo obtener el token push",
        body:
          result.detail?.trim() ||
          "Revisa FCM en expo.dev (Credentials → Android) y regenera el APK.",
      };
    case "http_error":
      return {
        title: "No se registró el dispositivo",
        body:
          result.detail?.trim() ||
          "El servidor rechazó POST /api/app/devices.",
      };
    case "network":
      return {
        title: "Sin conexión al registrar avisos",
        body: result.detail?.trim() || "Revisa la red e intenta entrar de nuevo.",
      };
    default:
      return {
        title: "Avisos no registrados",
        body: result.detail?.trim() || result.reason,
      };
  }
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const tokenPreview = (token: string) => `${token.slice(0, 28)}…`;

let lastRegisteredToken: string | null = null;
let lastRegisteredAt = 0;
const REREGISTER_COOLDOWN_MS = 60_000;
const loggedPushSkipReasons = new Set<string>();

export const registerPushIfPossible = async (options?: {
  force?: boolean;
}): Promise<RegisterPushResult> => {
  const tokenResult = await resolvePushToken();
  if (!tokenResult.ok) {
    // expo_go / web: un solo log; el resto solo en reintentos con force.
    const skipKey = tokenResult.reason;
    if (
      options?.force ||
      (skipKey !== "expo_go" && skipKey !== "web") ||
      !loggedPushSkipReasons.has(skipKey)
    ) {
      loggedPushSkipReasons.add(skipKey);
      logPushRegister("skip", tokenResult.reason, tokenResult.detail);
    }
    return {
      registered: false,
      reason: tokenResult.reason,
      detail: tokenResult.detail,
    };
  }

  const pushToken = tokenResult.token;
  const now = Date.now();
  if (
    !options?.force &&
    lastRegisteredToken === pushToken &&
    now - lastRegisteredAt < REREGISTER_COOLDOWN_MS
  ) {
    logPushRegister("skip", "cooldown", tokenPreview(pushToken));
    return {
      registered: true,
      reason: "ok",
      tokenPreview: tokenPreview(pushToken),
    };
  }

  let lastDetail: string | undefined;
  for (let attempt = 0; attempt < PUSH_REGISTER_ATTEMPTS; attempt += 1) {
    try {
      await apiClient.registerDevice({
        pushToken,
        platform: devicePlatform(),
      });
      lastRegisteredToken = pushToken;
      lastRegisteredAt = Date.now();
      logPushRegister("ok", tokenPreview(pushToken), `attempt=${attempt + 1}`);
      return {
        registered: true,
        reason: "ok",
        tokenPreview: tokenPreview(pushToken),
      };
    } catch (error) {
      if (error instanceof ApiError) {
        lastDetail = `status=${error.status} code=${error.code ?? "none"} msg=${error.message}`;
        logPushRegister("fail", lastDetail, `attempt=${attempt + 1}`);
        if (error.status === 401) {
          return {
            registered: false,
            reason: "http_error",
            detail: lastDetail,
          };
        }
      } else {
        lastDetail =
          error instanceof Error ? error.message : "unknown register error";
        logPushRegister("fail", "network", lastDetail, `attempt=${attempt + 1}`);
      }

      const delay = PUSH_REGISTER_BACKOFF_MS[attempt];
      if (delay != null && attempt < PUSH_REGISTER_ATTEMPTS - 1) {
        await sleep(delay);
      }
    }
  }

  return {
    registered: false,
    reason: lastDetail?.startsWith("status=") ? "http_error" : "network",
    detail: lastDetail,
  };
};

export const handleInboundPush = (data: {
  conversationId?: string;
  preview?: string;
  direction?: string;
}) => ({
  shouldRefreshChat: data.direction === "out" || Boolean(data.conversationId),
  preview: data.preview ?? null,
});
