import { apiClient, ApiError } from "@/lib/api-client";
import {
  devicePlatform,
  getPushTokenIfAvailable,
} from "@/features/devices/push-token";

export const registerPushIfPossible = async () => {
  const pushToken = await getPushTokenIfAvailable();
  if (!pushToken) {
    return { registered: false as const };
  }

  try {
    await apiClient.registerDevice({
      pushToken,
      platform: devicePlatform(),
    });
    return { registered: true as const };
  } catch (error) {
    if (error instanceof ApiError && error.status === 503) {
      return { registered: false as const };
    }
    throw error;
  }
};

export const handleInboundPush = (data: {
  conversationId?: string;
  preview?: string;
  direction?: string;
}) => ({
  shouldRefreshChat: data.direction === "out" || Boolean(data.conversationId),
  preview: data.preview ?? null,
});
