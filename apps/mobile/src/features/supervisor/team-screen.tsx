import { Text } from "@/components/ui/text";
import { ScreenState } from "@/components/screen-state";
import { useAuthSession } from "@/features/auth/auth-session";
import { TicketFilterGroup } from "@/features/supervisor/ticket-filter-group";
import { TeamTicketList } from "@/features/supervisor/team-ticket-list";
import { fetchTeamSnapshot } from "@/features/supervisor/supervisor-gateway";
import { filterTeamTickets } from "@/features/supervisor/ticket-scope";
import { useTechnicianCasosRealtime } from "@/features/technician/use-casos-realtime";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { ScrollView, View } from "react-native";
import type { TeamTicketFilter } from "@/types/domain";

export const SupervisorTeamScreen = () => {
  const { profile } = useAuthSession();
  const [filter, setFilter] = React.useState<TeamTicketFilter>("pending");

  useTechnicianCasosRealtime(profile?.supervisorId ?? "supervisor-team");

  const snapshotQuery = useQuery({
    queryKey: ["supervisor-team", profile?.userId],
    queryFn: () => fetchTeamSnapshot(profile),
    enabled: profile?.role === "supervisor",
  });

  const tickets = snapshotQuery.data
    ? filterTeamTickets(snapshotQuery.data.tickets, filter)
    : [];
  const counts = snapshotQuery.data?.counts;

  return (
    <View className="flex-1 bg-background">
      <View className="gap-3 p-4 pb-0">
        <TicketFilterGroup
          value={filter}
          onChange={setFilter}
          counts={counts}
        />
        <Text variant="muted">
          Todos los tickets del equipo. Sin cierre masivo ni cierre de casos
          ajenos.
        </Text>
      </View>
      <ScreenState
        isLoading={snapshotQuery.isPending}
        isEmpty={
          !snapshotQuery.isPending && !snapshotQuery.isError && tickets.length === 0
        }
        emptyTitle={
          filter === "pending"
            ? "No hay tickets pendientes"
            : filter === "done"
              ? "No hay tickets resueltos"
              : "No hay tickets de hoy"
        }
        emptyDescription="Cuando el CRM asigne casos al equipo, los verás aquí."
        errorMessage={
          snapshotQuery.isError ? "No se pudo cargar el equipo." : null
        }
        onRetry={() => {
          void snapshotQuery.refetch();
        }}
      >
        <ScrollView contentContainerClassName="gap-3 p-4">
          <TeamTicketList tickets={tickets} />
        </ScrollView>
      </ScreenState>
    </View>
  );
};
