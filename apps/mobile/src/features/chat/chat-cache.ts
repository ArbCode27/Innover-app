import type { ChatSnapshot } from "@/types/app-channel";
import type { AppMessage } from "@/types/domain";

export const CHAT_QUERY_KEY = ["chat-snapshot"] as const;

export const customerTicketsQueryKey = (userId: string | null | undefined) =>
  ["customer-tickets", userId] as const;

export const customerOpenTicketQueryKey = (userId: string | null | undefined) =>
  ["customer-open-ticket", userId] as const;

export const visibleMessageType = (type: string) =>
  type === "in" || type === "out";

export const dropOptimistic = (messages: AppMessage[]) =>
  messages.filter((message) => message.id > 0);

export const lastPersistedMessageId = (messages: AppMessage[]) => {
  let max = 0;
  for (const message of messages) {
    if (message.id > max) {
      max = message.id;
    }
  }
  return max;
};

export const upsertMessages = (
  existing: AppMessage[],
  incoming: AppMessage[],
): AppMessage[] => {
  const byId = new Map<number, AppMessage>();
  for (const message of existing) {
    byId.set(message.id, message);
  }
  for (const message of incoming) {
    byId.set(message.id, message);
  }
  return [...byId.values()].sort((left, right) => {
    if (left.id > 0 && right.id > 0 && left.id !== right.id) {
      return left.id - right.id;
    }
    return left.createdAt.localeCompare(right.createdAt);
  });
};

export const mergeChatSnapshot = (
  previous: ChatSnapshot | undefined,
  incoming: ChatSnapshot,
  options?: { replace?: boolean },
): ChatSnapshot => {
  if (!previous || options?.replace) {
    return {
      conversation: incoming.conversation,
      messages: upsertMessages([], incoming.messages),
    };
  }
  // Conserva optimistas (id < 0) durante catch-up; el send los limpia al confirmar.
  const pendingOptimistic = previous.messages.filter((message) => message.id < 0);
  return {
    conversation: incoming.conversation,
    messages: upsertMessages(
      [...dropOptimistic(previous.messages), ...pendingOptimistic],
      incoming.messages,
    ),
  };
};
