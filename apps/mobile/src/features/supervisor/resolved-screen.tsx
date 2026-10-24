import { Text } from "@/components/ui/text";
import { useGlassTabBarContentPadding } from "@/components/glass-tab-bar";
import { ScreenState } from "@/components/screen-state";
import { useAuthSession } from "@/features/auth/auth-session";
import { TeamFilterChips } from "@/features/supervisor/team-filter-chips";
import { TechnicianFilterSelect } from "@/features/supervisor/technician-filter-select";
import { TeamTicketList } from "@/features/supervisor/team-ticket-list";
import { fetchTeamSnapshot } from "@/features/supervisor/supervisor-gateway";
import {
  TEAM_DATE_FILTERS,
  countPriorityBreakdown,
  filterTeamTickets,
  filterTicketsByDate,
  filterTicketsByTechnician,
  listTechnicianOptions,
  teamDateFilterLabel,
  type TeamDateFilter,
} from "@/features/supervisor/ticket-scope";
import { useTechnicianCasosRealtime } from "@/features/technician/use-casos-realtime";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { RefreshControl, ScrollView, View } from "react-native";

export const SupervisorResolvedScreen = () => {
  const { profile } = useAuthSession();
  const tabBarContentPadding = useGlassTabBarContentPadding();
  const [dateFilter, setDateFilter] = React.useState<TeamDateFilter>("all");
  const [technicianKey, setTechnicianKey] = React.useState<string | null>(null);

  useTechnicianCasosRealtime(profile?.supervisorId ?? "supervisor-resolved");

  const snapshotQuery = useQuery({
    queryKey: ["supervisor-team", profile?.userId],
    queryFn: () => fetchTeamSnapshot(profile),
    enabled: profile?.role === "supervisor",
  });

  const doneTickets = React.useMemo(
    () => filterTeamTickets(snapshotQuery.data?.tickets ?? [], "done"),
    [snapshotQuery.data?.tickets],
  );

  const dateScopedTickets = React.useMemo(
    () => filterTicketsByDate(doneTickets, dateFilter),
    [dateFilter, doneTickets],
  );

  const technicianOptions = React.useMemo(
    () => listTechnicianOptions(dateScopedTickets),
    [dateScopedTickets],
  );

  React.useEffect(() => {
    if (
      technicianKey != null &&
      !technicianOptions.some((option) => option.key === technicianKey)
    ) {
      setTechnicianKey(null);
    }
  }, [technicianKey, technicianOptions]);

  const tickets = React.useMemo(
    () => filterTicketsByTechnician(dateScopedTickets, technicianKey),
    [dateScopedTickets, technicianKey],
  );

  const priorityCounts = React.useMemo(
    () => countPriorityBreakdown(tickets),
    [tickets],
  );

  const dateChipOptions = TEAM_DATE_FILTERS.filter(
    (item) => item !== "all",
  ).map((item) => ({
    key: item,
    label: teamDateFilterLabel(item),
  }));

  return (
    <View className="flex-1 bg-background">
      <View className="gap-3 border-b border-border/60 px-4 pb-3 pt-4">
        <Text className="text-sm text-muted-foreground">
          Visitas cerradas del equipo. Solo consulta.
        </Text>

        <TeamFilterChips
          label="Fecha"
          accessibilityLabel="Filtro por fecha de cierre"
          allowAll
          allLabel="Todas"
          value={dateFilter === "all" ? null : dateFilter}
          options={dateChipOptions}
          onChange={(next) => {
            setDateFilter((next as TeamDateFilter | null) ?? "all");
          }}
        />

        <TechnicianFilterSelect
          options={technicianOptions}
          value={technicianKey}
          onChange={setTechnicianKey}
        />

        <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
          <Text className="text-sm font-medium text-foreground">
            {priorityCounts.total === 1
              ? "1 resuelto"
              : `${priorityCounts.total} resueltos`}
          </Text>
          <Text className="text-xs text-muted-foreground">
            Sin cierre masivo
          </Text>
        </View>
      </View>

      <ScreenState
        isLoading={snapshotQuery.isPending}
        isEmpty={
          !snapshotQuery.isPending &&
          !snapshotQuery.isError &&
          tickets.length === 0
        }
        emptyTitle="No hay tickets resueltos"
        emptyDescription={
          technicianKey != null || dateFilter !== "all"
            ? "Prueba otro técnico o rango de fecha."
            : "Cuando el equipo cierre visitas, aparecerán aquí."
        }
        errorMessage={
          snapshotQuery.isError ? "No se pudieron cargar los resueltos." : null
        }
        onRetry={() => {
          void snapshotQuery.refetch();
        }}
      >
        <ScrollView
          contentContainerClassName="gap-3 p-4"
          contentContainerStyle={tabBarContentPadding}
          refreshControl={
            <RefreshControl
              refreshing={
                snapshotQuery.isRefetching && !snapshotQuery.isPending
              }
              onRefresh={() => {
                void snapshotQuery.refetch();
              }}
            />
          }
        >
          <TeamTicketList
            tickets={tickets}
            groupByTechnician={technicianKey == null}
          />
        </ScrollView>
      </ScreenState>
    </View>
  );
};
