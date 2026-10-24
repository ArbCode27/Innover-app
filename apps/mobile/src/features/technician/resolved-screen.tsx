import type {
  TechnicianStackParamList,
  TechnicianTabParamList,
} from "@/app/navigation-types";
import { Text } from "@/components/ui/text";
import { useGlassTabBarContentPadding } from "@/components/glass-tab-bar";
import { ScreenState } from "@/components/screen-state";
import { useAuthSession } from "@/features/auth/auth-session";
import { QueueTicketCard } from "@/features/technician/queue-ticket-card";
import { fetchTechnicianResolved } from "@/features/technician/technician-gateway";
import {
  technicianResolvedKey,
  useTechnicianCasosRealtime,
} from "@/features/technician/use-casos-realtime";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { RefreshControl, ScrollView, View } from "react-native";

type ResolvedNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<TechnicianTabParamList, "Resueltos">,
  NativeStackNavigationProp<TechnicianStackParamList>
>;

export const TechnicianResolvedScreen = () => {
  const { profile } = useAuthSession();
  const navigation = useNavigation<ResolvedNavigation>();
  const tabBarContentPadding = useGlassTabBarContentPadding();
  const employeeId = profile?.technicianId ?? null;

  useTechnicianCasosRealtime(employeeId);

  const resolvedQuery = useQuery({
    queryKey: technicianResolvedKey(employeeId),
    queryFn: () => fetchTechnicianResolved(profile),
    enabled: Boolean(employeeId),
  });

  const resolved = resolvedQuery.data ?? [];

  return (
    <View className="flex-1 bg-background">
      <ScreenState
        isLoading={resolvedQuery.isPending}
        isEmpty={
          !resolvedQuery.isPending &&
          !resolvedQuery.isError &&
          resolved.length === 0
        }
        emptyTitle="Sin tickets resueltos"
        emptyDescription="Cuando cierres una visita, el caso aparecerá aquí."
        errorMessage={
          resolvedQuery.isError ? "No se pudieron cargar los resueltos." : null
        }
        onRetry={() => {
          void resolvedQuery.refetch();
        }}
      >
        <ScrollView
          contentContainerClassName="gap-4 p-4"
          contentContainerStyle={tabBarContentPadding}
          refreshControl={
            <RefreshControl
              refreshing={
                resolvedQuery.isRefetching && !resolvedQuery.isPending
              }
              onRefresh={() => {
                void resolvedQuery.refetch();
              }}
            />
          }
        >
          <View className="gap-1">
            <Text className="text-lg font-semibold text-foreground">
              Resueltos
            </Text>
            <Text variant="muted">
              {resolved.length === 1
                ? "1 visita cerrada"
                : `${resolved.length} visitas cerradas`}
            </Text>
          </View>

          {resolved.map((caso) => (
            <QueueTicketCard
              key={caso.id}
              caso={caso}
              variant="resolved"
              onOpenDetail={() =>
                navigation.navigate("Caso", { casoId: caso.id })
              }
            />
          ))}
        </ScrollView>
      </ScreenState>
    </View>
  );
};
