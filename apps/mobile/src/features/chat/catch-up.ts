import { fetchConversationSnapshot } from "@/features/chat/app-chat-gateway";
import {
  CHAT_QUERY_KEY,
  lastPersistedMessageId,
  mergeChatSnapshot,
} from "@/features/chat/chat-cache";
import { invalidateCustomerTickets } from "@/features/customer/ticket-notification";
import type { ChatSnapshot } from "@/types/app-channel";
import type { QueryClient } from "@tanstack/react-query";

export const catchUpChannel = async (queryClient: QueryClient) => {
  const current = queryClient.getQueryData<ChatSnapshot>(CHAT_QUERY_KEY);
  const afterId = current ? lastPersistedMessageId(current.messages) : 0;

  try {
    const snapshot = await fetchConversationSnapshot(
      afterId > 0 ? afterId : undefined,
    );
    queryClient.setQueryData<ChatSnapshot>(CHAT_QUERY_KEY, (previous) =>
      mergeChatSnapshot(previous, snapshot, { replace: afterId <= 0 }),
    );
  } catch {
    // El query del chat muestra el error si el GET inicial falló.
  }

  await invalidateCustomerTickets(queryClient);
};
