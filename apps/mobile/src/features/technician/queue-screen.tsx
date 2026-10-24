import type {
  TechnicianStackParamList,
  TechnicianTabParamList,
} from "@/app/navigation-types";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useGlassTabBarContentPadding } from "@/components/glass-tab-bar";
import { ScreenState } from "@/components/screen-state";
import { useAuthSession } from "@/features/auth/auth-session";
import { QueueTicketCard } from "@/features/technician/queue-ticket-card";
import { ticketPriorityRank } from "@/features/technician/ticket-priority";
import {
  fetchTechnicianQueue,
  TECHNICIAN_QUEUE_PAGE_SIZE,
} from "@/features/technician/technician-gateway";
import {
  technicianQueueKey,
  useTechnicianCasosRealtime,
} from "@/features/technician/use-casos-realtime";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { RefreshControl, ScrollView, View } from "react-native";

type QueueNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<TechnicianTabParamList, "Cola">,
  NativeStackNavigationProp<TechnicianStackParamList>
>;

export const TechnicianQueueScreen = () => {
  const { profile } = useAuthSession();
  const navigation = useNavigation<QueueNavigation>();
  const tabBarContentPadding = useGlassTabBarContentPadding();
  const employeeId = profile?.technicianId ?? null;
  const [page, setPage] = React.useState(0);

  useTechnicianCasosRealtime(employeeId);

  const queueQuery = useQuery({
    queryKey: technicianQueueKey(employeeId),
    queryFn: () => fetchTechnicianQueue(profile),
    enabled: Boolean(employeeId),
  });

  const pending = React.useMemo(() => {
    const rows = queueQuery.data ?? [];
    return [...rows].sort(
      (left, right) =>
        ticketPriorityRank(left.priority) - ticketPriorityRank(right.priority),
    );
  }, [queueQuery.data]);

  const totalPages = Math.max(
    1,
    Math.ceil(pending.length / TECHNICIAN_QUEUE_PAGE_SIZE),
  );
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * TECHNICIAN_QUEUE_PAGE_SIZE;
  const visible = pending.slice(start, start + TECHNICIAN_QUEUE_PAGE_SIZE);
  const remaining = Math.max(0, pending.length - start - visible.length);

  const handleNextBatch = () => {
    setPage((current) => {
      const nextStart = (current + 1) * TECHNICIAN_QUEUE_PAGE_SIZE;
      return nextStart >= pending.length ? 0 : current + 1;
    });
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenState
        isLoading={queueQuery.isPending}
        isEmpty={
          !queueQuery.isPending && !queueQuery.isError && pending.length === 0
        }
        emptyTitle="No tienes tickets pendientes"
        emptyDescription="Cuando te asignen un caso, aparecerá aquí. Solo ves los tuyos."
        errorMessage={queueQuery.isError ? "No se pudo cargar tu cola." : null}
        onRetry={() => {
          void queueQuery.refetch();
        }}>
        <ScrollView
          contentContainerClassName="gap-4 p-4"
          contentContainerStyle={tabBarContentPadding}
          refreshControl={
            <RefreshControl
              refreshing={queueQuery.isRefetching && !queueQuery.isPending}
              onRefresh={() => {
                void queueQuery.refetch();
              }}
            />
          }>
          <View className="gap-1">
            <Text className="text-lg font-semibold text-foreground">
              Tus Tickets asignados
            </Text>
            <Text variant="muted">
              {pending.length === 1
                ? "1 ticket pendiente · ordenados por prioridad"
                : `${pending.length} tickets pendientes · ordenados por prioridad`}
            </Text>
          </View>

          {visible.map((caso) => (
            <QueueTicketCard
              key={caso.id}
              caso={caso}
              onOpenDetail={() =>
                navigation.navigate("Caso", { casoId: caso.id })
              }
            />
          ))}

          {pending.length > TECHNICIAN_QUEUE_PAGE_SIZE ? (
            <Button
              variant="outline"
              onPress={handleNextBatch}
              accessibilityLabel="Siguiente lote">
              <Text>
                {remaining > 0
                  ? `Siguiente lote (${remaining} más)`
                  : "Volver al inicio"}
              </Text>
            </Button>
          ) : null}
        </ScrollView>
      </ScreenState>
    </View>
  );
};
