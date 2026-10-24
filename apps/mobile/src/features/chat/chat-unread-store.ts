import { create } from "zustand";

type ChatUnreadState = {
  /** Último id de mensaje agent/bot visto mientras el chat estaba enfocado. */
  lastSeenIncomingId: number;
  /** Hay mensajes agent/bot más nuevos que lastSeenIncomingId. */
  hasUnread: boolean;
  noteIncoming: (messageId: number) => void;
  markSeenUpTo: (messageId: number) => void;
  syncFromMessages: (
    incomingIds: number[],
    chatFocused: boolean,
  ) => void;
  clear: () => void;
};

export const useChatUnreadStore = create<ChatUnreadState>((set, get) => ({
  lastSeenIncomingId: 0,
  hasUnread: false,
  noteIncoming: (messageId) => {
    const { lastSeenIncomingId } = get();
    if (messageId <= lastSeenIncomingId) {
      return;
    }
    set({ hasUnread: true });
  },
  markSeenUpTo: (messageId) => {
    if (messageId <= 0) {
      return;
    }
    set({
      lastSeenIncomingId: Math.max(get().lastSeenIncomingId, messageId),
      hasUnread: false,
    });
  },
  syncFromMessages: (incomingIds, chatFocused) => {
    if (incomingIds.length === 0) {
      return;
    }
    const newest = Math.max(...incomingIds);
    if (chatFocused) {
      set({ lastSeenIncomingId: newest, hasUnread: false });
      return;
    }
    const { lastSeenIncomingId } = get();
    if (lastSeenIncomingId === 0) {
      // Primera carga fuera de foco: no marcar histórico como no leído.
      set({ lastSeenIncomingId: newest, hasUnread: false });
      return;
    }
    set({ hasUnread: newest > lastSeenIncomingId });
  },
  clear: () => {
    set({ lastSeenIncomingId: 0, hasUnread: false });
  },
}));
