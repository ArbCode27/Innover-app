import { buildServiceNotice } from "@/features/customer/service-notice-gateway";
import type { ServiceNotice, ServiceNoticeKind } from "@/types/domain";
import { create } from "zustand";

const MAX_NOTICES = 4;

type ServiceNoticeState = {
  notices: ServiceNotice[];
  simulate: (kind: ServiceNoticeKind) => void;
  clear: () => void;
};

export const useServiceNoticeStore = create<ServiceNoticeState>((set) => ({
  notices: [],
  simulate: (kind) => {
    const next = buildServiceNotice(kind);
    set((state) => ({
      notices: [next, ...state.notices.filter((item) => item.kind !== kind)].slice(
        0,
        MAX_NOTICES,
      ),
    }));
  },
  clear: () => set({ notices: [] }),
}));

export const selectActiveNotice = (state: ServiceNoticeState) =>
  state.notices[0] ?? null;
