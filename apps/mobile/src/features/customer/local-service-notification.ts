import type { ServiceNotice, ServiceNoticeSeverity } from "@/types/domain";
import type { UserNotice } from "@/lib/user-notice";
import { isRunningInExpoGo } from "expo";
import { Platform } from "react-native";

type NotificationsModule = typeof import("expo-notifications");

type ChannelLevel = "max" | "high" | "default";

const CHANNEL_BY_SEVERITY: Record<
  ServiceNoticeSeverity,
  { id: string; name: string; level: ChannelLevel }
> = {
  critical: {
    id: "innover-critical",
    name: "Alertas de corte",
    level: "max",
  },
  warning: {
    id: "innover-warning",
    name: "Advertencias de red",
    level: "high",
  },
  info: {
    id: "innover-info",
    name: "Comunicados técnicos",
    level: "default",
  },
  success: {
    id: "innover-success",
    name: "Servicio restablecido",
    level: "default",
  },
};

export const EXPO_GO_LOCAL_NOTICE: UserNotice = {
  title: "Usa un development build",
  description:
    "Expo Go no puede mostrar avisos en la bandeja del teléfono. Ábrela con un development build de Android o iOS para verla.",
};

export const WEB_LOCAL_NOTICE: UserNotice = {
  title: "Prueba esto en el teléfono",
  description:
    "Las notificaciones del sistema no se pueden ver en el navegador. Ábrela en un development build de Android o iOS.",
};

let notificationsModule: NotificationsModule | null = null;
let handlerReady = false;
let channelsReady = false;

export const canPresentLocalServiceNotice = () =>
  Platform.OS !== "web" && !isRunningInExpoGo();

const importanceFor = (
  Notifications: NotificationsModule,
  level: ChannelLevel,
) => {
  if (level === "max") {
    return Notifications.AndroidImportance.MAX;
  }
  if (level === "high") {
    return Notifications.AndroidImportance.HIGH;
  }
  return Notifications.AndroidImportance.DEFAULT;
};

const loadNotifications = async (): Promise<NotificationsModule | null> => {
  if (!canPresentLocalServiceNotice()) {
    return null;
  }
  if (notificationsModule) {
    return notificationsModule;
  }

  const Notifications = await import("expo-notifications");
  if (!handlerReady) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    handlerReady = true;
  }
  notificationsModule = Notifications;
  return Notifications;
};

const ensureAndroidChannels = async (Notifications: NotificationsModule) => {
  if (Platform.OS !== "android" || channelsReady) {
    return;
  }
  for (const channel of Object.values(CHANNEL_BY_SEVERITY)) {
    const importance = importanceFor(Notifications, channel.level);
    await Notifications.setNotificationChannelAsync(channel.id, {
      name: channel.name,
      importance,
      vibrationPattern:
        channel.level === "max" || channel.level === "high"
          ? [0, 250, 250, 250]
          : undefined,
      enableVibrate: channel.level === "max" || channel.level === "high",
    });
  }
  channelsReady = true;
};

export type PresentLocalNoticeResult =
  | { ok: true }
  | { ok: false; notice: UserNotice };

export const presentLocalServiceNotice = async (
  notice: ServiceNotice,
): Promise<PresentLocalNoticeResult> => {
  if (Platform.OS === "web") {
    return { ok: false, notice: WEB_LOCAL_NOTICE };
  }
  if (isRunningInExpoGo()) {
    return { ok: false, notice: EXPO_GO_LOCAL_NOTICE };
  }

  try {
    const Notifications = await loadNotifications();
    if (!Notifications) {
      return { ok: false, notice: EXPO_GO_LOCAL_NOTICE };
    }

    await ensureAndroidChannels(Notifications);
    const permission = await Notifications.requestPermissionsAsync();
    if (permission.status !== "granted") {
      return {
        ok: false,
        notice: {
          title: "Activa las notificaciones",
          description:
            "Innover necesita permiso para mostrar avisos en la bandeja del teléfono.",
        },
      };
    }

    const channel = CHANNEL_BY_SEVERITY[notice.severity];
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notice.title,
        body: notice.body,
        sound: notice.severity === "critical" || notice.severity === "warning",
        data: {
          kind: notice.kind,
          noticeId: notice.id,
        },
      },
      trigger:
        Platform.OS === "android"
          ? { channelId: channel.id }
          : null,
    });
    return { ok: true };
  } catch {
    return {
      ok: false,
      notice: {
        title: "No se pudo mostrar en el teléfono",
        description:
          "Revisa el permiso de notificaciones e inténtalo de nuevo en un development build.",
      },
    };
  }
};
