import { useAuthSession } from "@/features/auth/auth-session";
import { useChannelLiveStore } from "@/features/chat/channel-live-store";
import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";

export const technicianQueueKey = (employeeId: string | null) =>
  ["technician-queue", employeeId] as const;

export const technicianResolvedKey = (employeeId: string | null) =>
  ["technician-resolved", employeeId] as const;

export const technicianCasoKey = (
  employeeId: string | null,
  casoId: string | undefined,
) => ["technician-caso", employeeId, casoId] as const;

/**
 * Refresco de colas de campo.
 * Los eventos de `field_tickets` llegan por el canal JWT de
 * `useAppChannelRealtime`. Aquí solo hacemos polling de respaldo
 * cuando realtime no está live.
 */
export const useTechnicianCasosRealtime = (employeeId: string | null) => {
  const queryClient = useQueryClient();
  const { session } = useAuthSession();
  const isLive = useChannelLiveStore((state) => state.isLive);

  React.useEffect(() => {
    if (!employeeId) {
      return;
    }

    // Con realtime live, useAppChannelRealtime ya invalida las queries.
    if (isLive && session?.realtime) {
      return;
    }

    const timer = setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: ["technician-queue"] });
      void queryClient.invalidateQueries({ queryKey: ["technician-resolved"] });
      void queryClient.invalidateQueries({ queryKey: ["technician-caso"] });
      void queryClient.invalidateQueries({ queryKey: ["supervisor-team"] });
      void queryClient.invalidateQueries({
        queryKey: ["supervisor-technician-queue"],
      });
      void queryClient.invalidateQueries({ queryKey: ["supervisor-metrics"] });
    }, 20_000);

    return () => {
      clearInterval(timer);
    };
  }, [employeeId, isLive, queryClient, session?.realtime]);
};
