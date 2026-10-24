import { Text } from "@/components/ui/text";
import { useGlassTabBarContentPadding } from "@/components/glass-tab-bar";
import { ScreenState } from "@/components/screen-state";
import { useAuthSession } from "@/features/auth/auth-session";
import {
  CloseRateRing,
  MetricBarChart,
  MetricsKpiStrip,
  MetricsRankingList,
  TopTechnicians,
} from "@/features/supervisor/metrics-charts";
import {
  formatCloseHours,
  rankMetricRows,
  summarizeTeamMetrics,
} from "@/features/supervisor/metrics-summary";
import { fetchSupervisorMetrics } from "@/features/supervisor/supervisor-gateway";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";

type MetricsRange = "today" | "7d" | "30d";

const RANGE_OPTIONS: { id: MetricsRange; label: string }[] = [
  { id: "today", label: "Hoy" },
  { id: "7d", label: "7 días" },
  { id: "30d", label: "30 días" },
];

export const SupervisorMetricsScreen = () => {
  const { profile } = useAuthSession();
  const tabBarContentPadding = useGlassTabBarContentPadding();
  const [range, setRange] = React.useState<MetricsRange>("7d");

  const metricsQuery = useQuery({
    queryKey: ["supervisor-metrics", profile?.userId, range],
    queryFn: () => fetchSupervisorMetrics(profile, range),
    enabled: profile?.role === "supervisor",
  });

  const ranked = React.useMemo(
    () => rankMetricRows(metricsQuery.data ?? []),
    [metricsQuery.data],
  );
  const summary = React.useMemo(() => summarizeTeamMetrics(ranked), [ranked]);

  const closedChartRows = React.useMemo(
    () => [...ranked].sort((a, b) => b.closed - a.closed),
    [ranked],
  );

  const closeTimeRows = React.useMemo(
    () =>
      ranked
        .filter((row) => row.avgCloseHours != null && row.closed > 0)
        .sort((a, b) => (a.avgCloseHours ?? 0) - (b.avgCloseHours ?? 0)),
    [ranked],
  );

  return (
    <View className="flex-1 bg-background">
      <View className="gap-3 border-b border-border/60 px-4 pb-3 pt-4">
        <Text className="text-base font-semibold text-foreground">
          Rendimiento del equipo
        </Text>
        <Text className="text-sm text-muted-foreground">
          Resueltos, tiempo de cierre y ranking por técnico.
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {RANGE_OPTIONS.map((option) => {
            const active = range === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => setRange(option.id)}
                className={`rounded-full border px-3 py-1.5 ${
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card"
                }`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Rango ${option.label}`}>
                <Text
                  className={`text-xs font-semibold ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScreenState
        isLoading={metricsQuery.isPending}
        isEmpty={
          !metricsQuery.isPending &&
          !metricsQuery.isError &&
          ranked.length === 0
        }
        emptyTitle="Sin métricas"
        emptyDescription="Cuando haya tickets asignados a técnicos, verás el rendimiento aquí."
        errorMessage={
          metricsQuery.isError ? "No se pudieron cargar las métricas." : null
        }
        onRetry={() => {
          void metricsQuery.refetch();
        }}>
        <ScrollView
          contentContainerClassName="gap-4 p-4"
          contentContainerStyle={tabBarContentPadding}
          refreshControl={
            <RefreshControl
              refreshing={metricsQuery.isRefetching && !metricsQuery.isPending}
              onRefresh={() => {
                void metricsQuery.refetch();
              }}
            />
          }>
          <MetricsKpiStrip summary={summary} />

          <View className="flex-row items-center gap-4 rounded-2xl border border-border/80 bg-card p-4">
            <CloseRateRing percent={summary.teamCloseRatePct} />
            <View className="min-w-0 flex-1 gap-2">
              <Text className="text-sm font-semibold text-foreground">
                Cierre del equipo
              </Text>
              <Text className="text-xs leading-5 text-muted-foreground">
                {summary.totalClosed} resueltos de {summary.totalAssigned}{" "}
                asignados en el período.
              </Text>
              <Text className="text-xs text-muted-foreground">
                Tiempo medio: {formatCloseHours(summary.avgCloseHours)}
              </Text>
            </View>
          </View>

          <TopTechnicians rows={ranked} />

          <MetricBarChart
            title="Tickets resueltos"
            subtitle="Cantidad de cierres por técnico"
            rows={closedChartRows}
            valueOf={(row) => row.closed}
            formatValue={(value) =>
              value === 1 ? "1 ticket" : `${value} tickets`
            }
            emptyHint="Aún no hay cierres en este período."
            barClassName="bg-primary"
          />

          <MetricBarChart
            title="Tiempo de cierre"
            subtitle="Promedio por ticket · menos horas es mejor"
            rows={closeTimeRows}
            valueOf={(row) => row.avgCloseHours ?? 0}
            formatValue={(value) => formatCloseHours(value)}
            emptyHint="Sin tiempos de cierre registrados aún."
            barClassName="bg-amber-500"
          />

          <MetricsRankingList rows={ranked} />
        </ScrollView>
      </ScreenState>
    </View>
  );
};
