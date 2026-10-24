import { catchUpChannel } from "@/features/chat/catch-up";
import { useChannelLiveStore } from "@/features/chat/channel-live-store";
import { CHAT_QUERY_KEY, upsertMessages } from "@/features/chat/chat-cache";
import { useChatUnreadStore } from "@/features/chat/chat-unread-store";
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
  type AppRealtimeTicketScope,
} from "@/lib/app-realtime-client";
import { coerceApiMessage, mapApiMessage } from "@/lib/map-api-message";
import type { ChatSnapshot } from "@/types/app-channel";
import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { AppState, type AppStateStatus } from "react-native";

const MAX_RECONNECT_DELAY_MS = 30_000;

const reconnectDelayMs = (attempt: number) =>
  Math.min(MAX_RECONNECT_DELAY_MS, 1_000 * 2 ** Math.min(Math.max(attempt - 1, 0), 5));

const logRealtime = (message: string, detail?: unknown) => {
  if (!__DEV__) {
    return;
  }
  if (detail !== undefined) {
    console.warn(`[realtime] ${message}`, detail);
    return;
  }
  console.warn(`[realtime] ${message}`);
};

const invalidateFieldTicketQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  void queryClient.invalidateQueries({ queryKey: ["technician-queue"] });
  void queryClient.invalidateQueries({ queryKey: ["technician-resolved"] });
  void queryClient.invalidateQueries({ queryKey: ["technician-caso"] });
  void queryClient.invalidateQueries({ queryKey: ["supervisor-team"] });
  void queryClient.invalidateQueries({
    queryKey: ["supervisor-technician-queue"],
  });
  void queryClient.invalidateQueries({ queryKey: ["supervisor-metrics"] });
};

export const useAppChannelRealtime = () => {
  const { session, applySession } = useAuthSession();
  const queryClient = useQueryClient();
  const markUnavailable = useChannelLiveStore((state) => state.markUnavailable);
  const markConnecting = useChannelLiveStore((state) => state.markConnecting);
  const markLive = useChannelLiveStore((state) => state.markLive);
  const markReconnecting = useChannelLiveStore(
    (state) => state.markReconnecting,
  );
  const markOffline = useChannelLiveStore((state) => state.markOffline);
  const [resubscribeKey, setResubscribeKey] = React.useState(0);
  const reconnectAttemptRef = React.useRef(0);
  const sessionRef = React.useRef(session);
  const loggedMissingCredsRef = React.useRef(false);
  const lastSubscribeLogKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Solo credenciales/identidad: cambios de humanMode/status no deben
  // tumbar el canal (eso era parte del loop de re-suscripción).
  const realtimeAccessToken = session?.realtime?.accessToken ?? null;
  const realtimeExpiresAt = session?.realtime?.expiresAt ?? null;
  const realtimeConversationId = session?.realtime?.conversationId ?? null;
  const conversationId = session?.conversation?.id ?? null;
  const sessionRole = session?.role ?? null;
  const technicianId = session?.technician?.id ?? null;
  const clientId = session?.client?.id ?? null;
  const organizationId = session?.organization.id ?? null;

  React.useEffect(() => {
    const handleAppState = (next: AppStateStatus) => {
      const current = sessionRef.current;
      if (next !== "active" || !current) {
        return;
      }

      void catchUpChannel(queryClient);

      const realtime = current.realtime;
      if (!realtime) {
        return;
      }

      if (realtimeNeedsRefresh(realtime.expiresAt)) {
        void (async () => {
          try {
            const hydrated = await hydrateRealtime(current);
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
  }, [applySession, queryClient]);

  React.useEffect(() => {
    const current = sessionRef.current;
    if (!current) {
      markUnavailable();
      loggedMissingCredsRef.current = false;
      return;
    }

    const realtime = current.realtime;
    const conversation = current.conversation;
    if (!realtime || !conversation) {
      markUnavailable();
      if (!loggedMissingCredsRef.current) {
        loggedMissingCredsRef.current = true;
        logRealtime("sin credenciales realtime en sesión");
      }
      return;
    }
    loggedMissingCredsRef.current = false;

    const resolvedConversationId =
      realtime.conversationId || conversation.id;
    const isFieldRole =
      current.role === "technician" || current.role === "supervisor";
    const channelKey = isFieldRole
      ? `tech:${current.technician?.id ?? "field"}`
      : `client:${current.client?.id ?? "customer"}`;

    let ticketScope: AppRealtimeTicketScope = { kind: "none" };
    if (current.role === "customer" && current.client?.id) {
      ticketScope = { kind: "client", clientId: current.client.id };
    } else if (current.role === "technician" && current.technician?.id) {
      ticketScope = {
        kind: "technician",
        technicianId: current.technician.id,
      };
    } else if (current.role === "supervisor" && current.organization.id) {
      ticketScope = {
        kind: "organization",
        organizationId: current.organization.id,
      };
    }

    const supabase = createAppRealtimeClient(realtime);
    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let didCatchUpOnSubscribe = false;

    markConnecting();
    const subscribeLogKey = `${channelKey}:${resolvedConversationId}:${realtime.accessToken}`;
    if (lastSubscribeLogKeyRef.current !== subscribeLogKey) {
      lastSubscribeLogKeyRef.current = subscribeLogKey;
      logRealtime("suscribiendo", {
        conversationId: resolvedConversationId,
        channelKey,
      });
    }

    const scheduleReconnect = (reason: string) => {
      if (cancelled) {
        return;
      }
      reconnectAttemptRef.current += 1;
      const attempt = reconnectAttemptRef.current;
      const delay = reconnectDelayMs(attempt);
      markReconnecting(attempt, reason);
      logRealtime(`${reason} → reintento #${attempt} en ${delay}ms`);
      reconnectTimer = setTimeout(() => {
        if (!cancelled) {
          setResubscribeKey((value) => value + 1);
        }
      }, delay);
    };

    const applyMessageRow = (row: Record<string, unknown>) => {
      const apiMessage = coerceApiMessage(row);
      if (!apiMessage || apiMessage.type === "note") {
        return;
      }
      const mapped = mapApiMessage(apiMessage);
      queryClient.setQueryData<ChatSnapshot>(CHAT_QUERY_KEY, (currentSnap) => {
        if (!currentSnap) {
          const liveConversation =
            sessionRef.current?.conversation ?? conversation;
          return {
            conversation: {
              id: resolvedConversationId,
              status: liveConversation.status,
              humanMode: liveConversation.humanMode,
            },
            messages: [mapped],
          };
        }
        return {
          ...currentSnap,
          messages: upsertMessages(currentSnap.messages, [mapped]),
        };
      });

      if (
        isFieldRole &&
        (mapped.senderType === "agent" || mapped.senderType === "bot")
      ) {
        useChatUnreadStore.getState().noteIncoming(mapped.id);
      }
    };

    const applyHumanMode = (row: Record<string, unknown>) => {
      if (typeof row.human_mode === "undefined") {
        return;
      }
      const humanMode = Boolean(row.human_mode);
      queryClient.setQueryData<ChatSnapshot>(CHAT_QUERY_KEY, (currentSnap) => {
        if (!currentSnap) {
          return currentSnap;
        }
        return {
          ...currentSnap,
          conversation: {
            ...currentSnap.conversation,
            humanMode,
          },
        };
      });
    };

    const unsubscribe = subscribeAppRealtime({
      supabase,
      conversationId: resolvedConversationId,
      channelKey,
      ticketScope,
      onMessage: (row) => {
        applyMessageRow(row);
      },
      onConversation: (row) => {
        applyHumanMode(row);
      },
      onTicket: (row, event) => {
        if (isFieldRole) {
          invalidateFieldTicketQueries(queryClient);
          return;
        }
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
          reconnectAttemptRef.current = 0;
          markLive(status);
          if (!didCatchUpOnSubscribe) {
            didCatchUpOnSubscribe = true;
            void catchUpChannel(queryClient);
          }
          return;
        }
        logRealtime("status", status);
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          markOffline(status);
          void catchUpChannel(queryClient);
          scheduleReconnect(status);
          return;
        }
        if (status === "CLOSED") {
          markOffline(status);
        }
      },
    });

    const refreshTimer = setTimeout(() => {
      void (async () => {
        const latest = sessionRef.current;
        if (!latest || cancelled) {
          return;
        }
        try {
          const next = await hydrateRealtime(latest);
          if (!cancelled) {
            await applySession(next);
          }
        } catch {
          if (!cancelled) {
            markOffline("TOKEN_REFRESH_FAILED");
            scheduleReconnect("TOKEN_REFRESH_FAILED");
          }
        }
      })();
    }, msUntilRealtimeRefresh(realtime.expiresAt));

    return () => {
      cancelled = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      clearTimeout(refreshTimer);
      unsubscribe();
    };
  }, [
    applySession,
    clientId,
    conversationId,
    markConnecting,
    markLive,
    markOffline,
    markReconnecting,
    markUnavailable,
    organizationId,
    queryClient,
    realtimeAccessToken,
    realtimeConversationId,
    realtimeExpiresAt,
    resubscribeKey,
    sessionRole,
    technicianId,
  ]);
};
