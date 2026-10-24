import { useAuthSession } from "@/features/auth/auth-session";
import {
  ensureChatPushChannel,
  handleChatPushReceived,
  handleChatPushResponse,
  shouldAlertForIncomingChat,
} from "@/features/chat/chat-notification";
import {
  ensureTicketPushChannel,
  handleTicketPushReceived,
  handleTicketPushResponse,
  isFieldTicketPush,
  shouldShowTicketBanner,
} from "@/features/customer/ticket-notification";
import { registerPushIfPossible } from "@/features/devices/devices-gateway";
import { canUseNativeNotifications } from "@/features/devices/push-token";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import * as React from "react";
import { AppState, type AppStateStatus } from "react-native";

let coldStartResponseHandled = false;

const routeNotificationData = (
  queryClient: QueryClient,
  data: unknown,
  mode: "received" | "response",
) => {
  if (isFieldTicketPush(data)) {
    if (mode === "response") {
      void handleTicketPushResponse(queryClient, data);
      return;
    }
    void handleTicketPushReceived(queryClient);
    return;
  }
  if (mode === "response") {
    void handleChatPushResponse(queryClient, data);
    return;
  }
  void handleChatPushReceived(queryClient);
};

export const usePushRegistration = () => {
  const { session } = useAuthSession();
  const queryClient = useQueryClient();

  const sessionToken = session?.token ?? null;

  React.useEffect(() => {
    if (!sessionToken) {
      return;
    }

    void registerPushIfPossible();

    if (!canUseNativeNotifications()) {
      return;
    }

    let removeResponse: { remove: () => void } | undefined;
    let removeReceived: { remove: () => void } | undefined;
    let removeToken: { remove: () => void } | undefined;
    let cancelled = false;

    const listen = async () => {
      try {
        const Notifications = await import("expo-notifications");
        if (cancelled) {
          return;
        }

        await ensureChatPushChannel();
        await ensureTicketPushChannel();

        Notifications.setNotificationHandler({
          handleNotification: async (notification) => {
            const data = notification.request.content.data;
            if (isFieldTicketPush(data)) {
              const show = shouldShowTicketBanner(data);
              return {
                shouldShowAlert: show,
                shouldPlaySound: show,
                shouldSetBadge: false,
                shouldShowBanner: show,
                shouldShowList: show,
              };
            }
            const alert = shouldAlertForIncomingChat();
            return {
              shouldShowAlert: alert,
              shouldPlaySound: alert,
              shouldSetBadge: false,
              shouldShowBanner: alert,
              shouldShowList: alert,
            };
          },
        });

        removeResponse = Notifications.addNotificationResponseReceivedListener(
          (response) => {
            routeNotificationData(
              queryClient,
              response.notification.request.content.data,
              "response",
            );
          },
        );

        removeReceived = Notifications.addNotificationReceivedListener(
          (notification) => {
            routeNotificationData(
              queryClient,
              notification.request.content.data,
              "received",
            );
          },
        );

        removeToken = Notifications.addPushTokenListener(() => {
          void registerPushIfPossible({ force: true });
        });

        if (!coldStartResponseHandled) {
          const cold =
            await Notifications.getLastNotificationResponseAsync();
          if (!cancelled && cold?.notification.request.content.data) {
            coldStartResponseHandled = true;
            // El navigator puede no estar ready al restaurar sesión.
            setTimeout(() => {
              if (cancelled) {
                return;
              }
              routeNotificationData(
                queryClient,
                cold.notification.request.content.data,
                "response",
              );
            }, 400);
          } else {
            coldStartResponseHandled = true;
          }
        }
      } catch (error) {
        console.warn("[push] listeners failed", error);
      }
    };

    void listen();

    const handleAppState = (next: AppStateStatus) => {
      if (next === "active") {
        void registerPushIfPossible();
      }
    };
    const appStateSub = AppState.addEventListener("change", handleAppState);

    return () => {
      cancelled = true;
      appStateSub.remove();
      removeResponse?.remove();
      removeReceived?.remove();
      removeToken?.remove();
    };
  }, [queryClient, sessionToken]);
};
