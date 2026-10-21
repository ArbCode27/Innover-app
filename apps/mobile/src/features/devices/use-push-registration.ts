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
import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";

export const usePushRegistration = () => {
  const { session } = useAuthSession();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!session) {
      return;
    }

    void registerPushIfPossible();

    if (!canUseNativeNotifications()) {
      return;
    }

    let removeResponse: { remove: () => void } | undefined;
    let removeReceived: { remove: () => void } | undefined;

    const listen = async () => {
      try {
        const Notifications = await import("expo-notifications");
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
            const data = response.notification.request.content.data;
            if (isFieldTicketPush(data)) {
              void handleTicketPushResponse(queryClient, data);
              return;
            }
            void handleChatPushResponse(queryClient, data);
          },
        );
        removeReceived = Notifications.addNotificationReceivedListener(
          (notification) => {
            const data = notification.request.content.data;
            if (isFieldTicketPush(data)) {
              void handleTicketPushReceived(queryClient);
              return;
            }
            void handleChatPushReceived(queryClient);
          },
        );
      } catch {
        return;
      }
    };

    void listen();

    return () => {
      removeResponse?.remove();
      removeReceived?.remove();
    };
  }, [queryClient, session]);
};
