import { create } from "zustand";

/** Estado del canal Realtime de la app. */
export type ChannelConnectionStatus =
  | "unavailable"
  | "connecting"
  | "live"
  | "reconnecting"
  | "offline";

type ChannelLiveState = {
  status: ChannelConnectionStatus;
  /** Atajo: `status === "live"`. */
  isLive: boolean;
  lastChannelStatus: string | null;
  reconnectAttempt: number;
  markUnavailable: () => void;
  markConnecting: () => void;
  markLive: (channelStatus?: string) => void;
  markReconnecting: (attempt: number, channelStatus?: string) => void;
  markOffline: (channelStatus?: string) => void;
};

export const connectionStatusLabel = (
  status: ChannelConnectionStatus,
): string => {
  switch (status) {
    case "live":
      return "En vivo";
    case "connecting":
      return "Conectando…";
    case "reconnecting":
      return "Reconectando…";
    case "offline":
      return "Sin tiempo real";
    case "unavailable":
    default:
      return "Actualización periódica";
  }
};

export const useChannelLiveStore = create<ChannelLiveState>((set) => ({
  status: "unavailable",
  isLive: false,
  lastChannelStatus: null,
  reconnectAttempt: 0,
  markUnavailable: () =>
    set({
      status: "unavailable",
      isLive: false,
      lastChannelStatus: null,
      reconnectAttempt: 0,
    }),
  markConnecting: () =>
    set({
      status: "connecting",
      isLive: false,
    }),
  markLive: (channelStatus) =>
    set({
      status: "live",
      isLive: true,
      lastChannelStatus: channelStatus ?? "SUBSCRIBED",
      reconnectAttempt: 0,
    }),
  markReconnecting: (attempt, channelStatus) =>
    set({
      status: "reconnecting",
      isLive: false,
      reconnectAttempt: attempt,
      lastChannelStatus: channelStatus ?? null,
    }),
  markOffline: (channelStatus) =>
    set({
      status: "offline",
      isLive: false,
      lastChannelStatus: channelStatus ?? null,
    }),
}));
