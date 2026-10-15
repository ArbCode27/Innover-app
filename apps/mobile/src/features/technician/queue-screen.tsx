import type { TechnicianTabParamList } from "@/app/navigation-types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { ScreenState } from "@/components/screen-state";
import { useAuthSession } from "@/features/auth/auth-session";
import { TicketStatusBadge } from "@/features/customer/ticket-status-badge";
import {
  fetchTechnicianQueue,
  TECHNICIAN_QUEUE_PAGE_SIZE,
} from "@/features/technician/technician-gateway";
import {
  technicianQueueKey,
  useTechnicianCasosRealtime,
} from "@/features/technician/use-casos-realtime";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { Pressable, ScrollView, View } from "react-native";

export const TechnicianQueueScreen = () => {
  const { profile } = useAuthSession();
  const navigation =
    useNavigation<BottomTabNavigationProp<TechnicianTabParamList>>();
  const employeeId = profile?.technicianId ?? null;
  const [page, setPage] = React.useState(0);

  useTechnicianCasosRealtime(employeeId);

  const queueQuery = useQuery({
    queryKey: technicianQueueKey(employeeId),
    queryFn: () => fetchTechnicianQueue(profile),
    enabled: Boolean(employeeId),
  });

  const pending = queueQuery.data ?? [];
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
        isEmpty={!queueQuery.isPending && !queueQuery.isError && pending.length === 0}
        emptyTitle="No tienes tickets pendientes"
        emptyDescription="Cuando te asignen un caso, aparecerá aquí. Solo ves los tuyos."
        errorMessage={
          queueQuery.isError ? "No se pudo cargar tu cola." : null
        }
        onRetry={() => {
          void queueQuery.refetch();
        }}
      >
        <ScrollView contentContainerClassName="gap-3 p-4">
          <Text variant="muted">
            {pending.length === 1
              ? "1 ticket pendiente"
              : `${pending.length} tickets pendientes`}
          </Text>
          {visible.map((caso) => (
            <Pressable
              key={caso.id}
              onPress={() => navigation.navigate("Caso", { casoId: caso.id })}
              accessibilityRole="button"
              accessibilityLabel={`Abrir caso de ${caso.clientName ?? "cliente"}`}
              className="min-h-11"
            >
              <Card>
                <CardHeader>
                  <CardTitle>{caso.clientName ?? "Cliente"}</CardTitle>
                  <CardDescription>{caso.title}</CardDescription>
                </CardHeader>
                <CardContent className="gap-2">
                  <TicketStatusBadge status={caso.status} />
                  <Text variant="muted">
                    Zona: {caso.addressText?.trim() || "Sin zona"}
                  </Text>
                </CardContent>
              </Card>
            </Pressable>
          ))}
          {pending.length > TECHNICIAN_QUEUE_PAGE_SIZE ? (
            <Button
              variant="outline"
              onPress={handleNextBatch}
              accessibilityLabel="Siguiente lote"
            >
              <Text>
                {remaining > 0
                  ? `Siguiente lote (${remaining} más)`
                  : "Siguiente lote"}
              </Text>
            </Button>
          ) : null}
        </ScrollView>
      </ScreenState>
    </View>
  );
};
