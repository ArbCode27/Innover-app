import { useAppChannelRealtime } from "@/features/chat/use-app-channel-realtime";
import { usePushRegistration } from "@/features/devices/use-push-registration";

export const SessionServices = () => {
  useAppChannelRealtime();
  usePushRegistration();
  return null;
};
