import { hasSupabasePublicEnv } from "@/lib/supabase-env";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";

export const technicianQueueKey = (employeeId: string | null) =>
  ["technician-queue", employeeId] as const;

export const technicianCasoKey = (
  employeeId: string | null,
  casoId: string | undefined,
) => ["technician-caso", employeeId, casoId] as const;

export const useTechnicianCasosRealtime = (employeeId: string | null) => {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!employeeId || !hasSupabasePublicEnv()) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`crm-wispro-casos-${employeeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "crm_wispro_casos",
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ["technician-queue"],
          });
          void queryClient.invalidateQueries({
            queryKey: ["technician-caso"],
          });
          void queryClient.invalidateQueries({
            queryKey: ["supervisor-team"],
          });
          void queryClient.invalidateQueries({
            queryKey: ["supervisor-technician-queue"],
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [employeeId, queryClient]);
};
