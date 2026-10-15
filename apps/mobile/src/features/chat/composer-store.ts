import type { OutboundClientDraft } from "@/types/domain";
import { create } from "zustand";

type ComposerState = {
  draft: string;
  failedDraft: OutboundClientDraft | null;
  setDraft: (value: string) => void;
  markFailed: (draft: OutboundClientDraft) => void;
  clearFailed: () => void;
};

export const useComposerStore = create<ComposerState>((set) => ({
  draft: "",
  failedDraft: null,
  setDraft: (draft) => set({ draft }),
  markFailed: (failedDraft) => set({ failedDraft, draft: "" }),
  clearFailed: () => set({ failedDraft: null }),
}));
