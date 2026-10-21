import { catchUpChannel } from "@/features/chat/catch-up";
import { useChannelLiveStore } from "@/features/chat/channel-live-store";
import { CHAT_QUERY_KEY, upsertMessages } from "@/features/chat/chat-cache";
import { useAuthSession } from "@/features/auth/auth-session";
import {
  invalidateCustomerTickets,
  presentTicketCreatedNotice,
  ticketNoticeFromRealtimeRow,
} from "@/features/customer/ticket-notification";
import {
  hydrateRealtime,
  msUntilRealtimeRefresh,
  realtimeNeedsRefresh,
} from "@/features/auth/session-gateway";
import {
  createAppRealtimeClient,
  subscribeAppRealtime,
} from "@/lib/app-realtime-client";
import { coerceApiMessage, mapApiMessage } from "@/lib/map-api-message";
import type { ChatSnapshot } from "@/types/app-channel";
import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { AppState, type AppStateStatus } from "react-native";

export const useAppChannelRealtime = () => {
  const { session, applySession } = useAuthSession();
  const queryClient = useQueryClient();
  const setLive = useChannelLiveStore((state) => state.setLive);
  const [resubscribeKey, setResubscribeKey] = React.useState(0);

  React.useEffect(() => {
    const handleAppState = (next: AppStateStatus) => {
      if (next !== "active" || !session) {
        return;
      }

      void catchUpChannel(queryClient);

      const realtime = session.realtime;
      if (!realtime) {
        return;
      }

      if (realtimeNeedsRefresh(realtime.expiresAt)) {
        void (async () => {
          try {
            const hydrated = await hydrateRealtime(session);
            await applySession(hydrated);
          } catch {
            if (!useChannelLiveStore.getState().isLive) {
              setResubscribeKey((value) => value + 1);
            }
          }
        })();
        return;
      }

      if (!useChannelLiveStore.getState().isLive) {
        setResubscribeKey((value) => value + 1);
      }
    };

    const subscription = AppState.addEventListener("change", handleAppState);
    return () => {
      subscription.remove();
    };
  }, [applySession, queryClient, session]);

  React.useEffect(() => {
    if (!session) {
      setLive(false);
      return;
    }

    const realtime = session.realtime;
    if (!realtime) {
      setLive(false);
      return;
    }

    const conversationId = realtime.conversationId || session.conversation.id;
    const clientId = session.client.id;
    const supabase = createAppRealtimeClient(realtime);
    let cancelled = false;

    const applyMessageRow = (row: Record<string, unknown>) => {
      const apiMessage = coerceApiMessage(row);
      if (!apiMessage || apiMessage.type === "note") {
        return;
      }
      const mapped = mapApiMessage(apiMessage);
      queryClient.setQueryData<ChatSnapshot>(CHAT_QUERY_KEY, (current) => {
        if (!current) {
          return {
            conversation: {
              id: conversationId,
              status: session.conversation.status,
              humanMode: session.conversation.humanMode,
            },
            messages: [mapped],
          };
        }
        return {
          ...current,
          messages: upsertMessages(current.messages, [mapped]),
        };
      });
    };

    const applyHumanMode = (row: Record<string, unknown>) => {
      if (typeof row.human_mode === "undefined") {
        return;
      }
      const humanMode = Boolean(row.human_mode);
      queryClient.setQueryData<ChatSnapshot>(CHAT_QUERY_KEY, (current) => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          conversation: {
            ...current.conversation,
            humanMode,
          },
        };
      });
    };

    const unsubscribe = subscribeAppRealtime({
      supabase,
      conversationId,
      clientId,
      onMessage: (row) => {
        applyMessageRow(row);
      },
      onConversation: (row) => {
        applyHumanMode(row);
      },
      onTicket: (row, event) => {
        void invalidateCustomerTickets(queryClient);
        if (event === "INSERT") {
          void presentTicketCreatedNotice(ticketNoticeFromRealtimeRow(row));
        }
      },
      onStatus: (status) => {
        if (cancelled) {
          return;
        }
        if (status === "SUBSCRIBED") {
          setLive(true);
          void catchUpChannel(queryClient);
          return;
        }
        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          setLive(false);
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            void catchUpChannel(queryClient);
          }
        }
      },
    });

    const refreshTimer = setTimeout(() => {
      void (async () => {
        try {
          const next = await hydrateRealtime(session);
          if (!cancelled) {
            await applySession(next);
          }
        } catch {
          if (!cancelled) {
            setLive(false);
          }
        }
      })();
    }, msUntilRealtimeRefresh(realtime.expiresAt));

    return () => {
      cancelled = true;
      setLive(false);
      clearTimeout(refreshTimer);
      unsubscribe();
    };
  }, [applySession, queryClient, resubscribeKey, session, setLive]);
};
