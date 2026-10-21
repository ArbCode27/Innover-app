import { create } from "zustand";

type ChannelLiveState = {
  isLive: boolean;
  setLive: (isLive: boolean) => void;
};

export const useChannelLiveStore = create<ChannelLiveState>((set) => ({
  isLive: false,
  setLive: (isLive) => set({ isLive }),
}));
