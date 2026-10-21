import { openMyTicket } from "@/app/navigation-ref";
import { canUseNativeNotifications } from "@/features/devices/push-token";
import { isRunningInExpoGo } from "expo";
import type { QueryClient } from "@tanstack/react-query";
import { Alert, Platform } from "react-native";

export const TICKET_PUSH_KIND = "field_ticket";
export const TICKET_PUSH_CHANNEL_ID = "star-ticket";

const DEDUPE_MS = 60_000;

export type TicketNoticePayload = {
  ticketId?: string;
  publicId?: number | null;
  title?: string | null;
};

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object") {
    return {};
  }
  return value as Record<string, unknown>;
};

const recentNotices = new Map<string, number>();

const noticeKey = (payload: TicketNoticePayload) => {
  if (payload.ticketId) {
    return payload.ticketId;
  }
  if (payload.publicId != null) {
    return `public:${payload.publicId}`;
  }
  if (payload.title?.trim()) {
    return `title:${payload.title.trim()}`;
  }
  return null;
};

const markNotified = (key: string) => {
  recentNotices.set(key, Date.now());
};

export const shouldNotifyTicketCreation = (payload: TicketNoticePayload) => {
  const key = noticeKey(payload);
  if (!key) {
    return true;
  }
  const last = recentNotices.get(key);
  if (last != null && Date.now() - last < DEDUPE_MS) {
    return false;
  }
  markNotified(key);
  return true;
};

export const readTicketPushData = (value: unknown): TicketNoticePayload & {
  kind?: string;
  source?: string;
} => {
  const row = asRecord(value);
  const ticketId =
    typeof row.ticketId === "string"
      ? row.ticketId
      : typeof row.id === "string"
        ? row.id
        : undefined;
  const publicId =
    typeof row.publicId === "number"
      ? row.publicId
      : typeof row.public_id === "number"
        ? row.public_id
        : null;
  const title =
    typeof row.title === "string" && row.title.trim() ? row.title.trim() : null;
  return {
    kind: typeof row.kind === "string" ? row.kind : undefined,
    source: typeof row.source === "string" ? row.source : undefined,
    ticketId,
    publicId,
    title,
  };
};

export const shouldShowTicketBanner = (value: unknown) => {
  const parsed = readTicketPushData(value);
  if (parsed.source === "local") {
    return true;
  }
  return shouldNotifyTicketCreation(parsed);
};

export const isFieldTicketPush = (value: unknown) =>
  readTicketPushData(value).kind === TICKET_PUSH_KIND;

export const ticketNoticeFromRealtimeRow = (
  row: Record<string, unknown>,
): TicketNoticePayload => {
  const parsed = readTicketPushData(row);
  return {
    ticketId: parsed.ticketId,
    publicId: parsed.publicId,
    title: parsed.title,
  };
};

export const ticketNoticeCopy = (payload: TicketNoticePayload) => {
  const publicLabel =
    payload.publicId != null ? `Visita #${payload.publicId}` : null;
  const title = payload.title?.trim() || null;
  return {
    title: "Visita técnica registrada",
    body: publicLabel
      ? title
        ? `${publicLabel} · ${title}. Ábrela en Mi ticket.`
        : `${publicLabel}. Ábrela en Mi ticket.`
      : "Hay un seguimiento de visita en tu cuenta. Ábrelo en Mi ticket.",
  };
};

const canPresentSystemNotice = () =>
  Platform.OS !== "web" && !isRunningInExpoGo() && canUseNativeNotifications();

export const ensureTicketPushChannel = async () => {
  if (!canPresentSystemNotice()) {
    return;
  }
  try {
    const Notifications = await import("expo-notifications");
    await Notifications.setNotificationChannelAsync(TICKET_PUSH_CHANNEL_ID, {
      name: "Visitas técnicas",
      importance: Notifications.AndroidImportance.HIGH,
    });
  } catch {
    return;
  }
};

const presentSystemNotice = async (payload: TicketNoticePayload) => {
  const Notifications = await import("expo-notifications");
  await ensureTicketPushChannel();
  const permission = await Notifications.requestPermissionsAsync();
  if (permission.status !== "granted") {
    return false;
  }
  const copy = ticketNoticeCopy(payload);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: copy.title,
      body: copy.body,
      sound: true,
      data: {
        kind: TICKET_PUSH_KIND,
        source: "local",
        ticketId: payload.ticketId,
        publicId: payload.publicId,
        title: payload.title,
      },
    },
    trigger:
      Platform.OS === "android" ? { channelId: TICKET_PUSH_CHANNEL_ID } : null,
  });
  return true;
};

const presentInAppNotice = (payload: TicketNoticePayload) => {
  const copy = ticketNoticeCopy(payload);
  Alert.alert(copy.title, copy.body, [
    { text: "Cerrar", style: "cancel" },
    {
      text: "Ver visita",
      onPress: () => {
        openMyTicket();
      },
    },
  ]);
};

export const presentTicketCreatedNotice = async (
  payload: TicketNoticePayload,
) => {
  if (!shouldNotifyTicketCreation(payload)) {
    return;
  }

  if (canPresentSystemNotice()) {
    try {
      const shown = await presentSystemNotice(payload);
      if (shown) {
        return;
      }
    } catch {
      // Caemos al aviso in-app para no perder el alta.
    }
  }

  presentInAppNotice(payload);
};

export const invalidateCustomerTickets = async (queryClient: QueryClient) => {
  await queryClient.invalidateQueries({ queryKey: ["customer-tickets"] });
  await queryClient.invalidateQueries({ queryKey: ["customer-open-ticket"] });
  await queryClient.invalidateQueries({ queryKey: ["customer-ticket"] });
};

export const handleTicketPushReceived = async (queryClient: QueryClient) => {
  await invalidateCustomerTickets(queryClient);
};

export const handleTicketPushResponse = async (
  queryClient: QueryClient,
  data: unknown,
) => {
  const parsed = readTicketPushData(data);
  if (parsed.ticketId) {
    markNotified(parsed.ticketId);
  }
  await invalidateCustomerTickets(queryClient);
  openMyTicket();
};
