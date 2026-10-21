import { create } from "zustand";

type ChatFocusState = {
  isChatFocused: boolean;
  setChatFocused: (isChatFocused: boolean) => void;
};

export const useChatFocusStore = create<ChatFocusState>((set) => ({
  isChatFocused: false,
  setChatFocused: (isChatFocused) => set({ isChatFocused }),
}));
