import { openInboxChat } from "@/app/navigation-ref";
import { catchUpChannel } from "@/features/chat/catch-up";
import { useChatFocusStore } from "@/features/chat/chat-focus-store";
import { handleInboundPush } from "@/features/devices/devices-gateway";
import { canUseNativeNotifications } from "@/features/devices/push-token";
import type { QueryClient } from "@tanstack/react-query";

export const CHAT_PUSH_CHANNEL_ID = "star-chat";

type ChatPushData = {
  kind?: string;
  conversationId?: string;
  preview?: string;
  direction?: string;
};

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object") {
    return {};
  }
  return value as Record<string, unknown>;
};

export const readChatPushData = (value: unknown): ChatPushData => {
  const row = asRecord(value);
  const conversationId =
    typeof row.conversationId === "string"
      ? row.conversationId
      : typeof row.conversationId === "number"
        ? String(row.conversationId)
        : undefined;
  return {
    kind: typeof row.kind === "string" ? row.kind : undefined,
    conversationId,
    preview: typeof row.preview === "string" ? row.preview : undefined,
    direction: typeof row.direction === "string" ? row.direction : undefined,
  };
};

export const isChatMessagePush = (data: ChatPushData) =>
  data.kind === "chat_message" ||
  data.direction === "out" ||
  Boolean(data.conversationId);

export const shouldAlertForIncomingChat = () =>
  !useChatFocusStore.getState().isChatFocused;

export const handleChatPushReceived = async (queryClient: QueryClient) => {
  await catchUpChannel(queryClient);
};

export const handleChatPushResponse = async (
  queryClient: QueryClient,
  data: unknown,
) => {
  const parsed = readChatPushData(data);
  const inbound = handleInboundPush(parsed);
  if (inbound.shouldRefreshChat) {
    await catchUpChannel(queryClient);
  }
  if (isChatMessagePush(parsed)) {
    openInboxChat();
  }
};

export const ensureChatPushChannel = async () => {
  if (!canUseNativeNotifications()) {
    return;
  }
  try {
    const Notifications = await import("expo-notifications");
    await Notifications.setNotificationChannelAsync(CHAT_PUSH_CHANNEL_ID, {
      name: "Mensajes",
      importance: Notifications.AndroidImportance.HIGH,
    });
  } catch {
    return;
  }
};
