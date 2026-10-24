import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import type { SupervisorMetricRow } from "@/features/supervisor/supervisor-gateway";
import {
  formatCloseHours,
  type TeamMetricsSummary,
} from "@/features/supervisor/metrics-summary";
import { THEME } from "@/lib/theme";
import { cn } from "@/lib/utils";
import {
  Award,
  CheckCircle2,
  Clock3,
  Ticket,
  TrendingUp,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import * as React from "react";
import { View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

type MetricsKpiStripProps = {
  summary: TeamMetricsSummary;
};

export const MetricsKpiStrip = ({ summary }: MetricsKpiStripProps) => (
  <View className="flex-col flex-wrap gap-2">
    <View className="flex-row flex-wrap gap-2">
      <KpiCard
        icon={CheckCircle2}
        label="Resueltos"
        value={String(summary.totalClosed)}
        hint={`${summary.totalAssigned} asignados`}
        accent="primary"
      />
      <KpiCard
        icon={TrendingUp}
        label="% cierre"
        value={`${summary.teamCloseRatePct}%`}
        hint={`${summary.totalPending} pendientes`}
        accent="emerald"
      />
    </View>
    <View className="flex-row flex-wrap gap-2">
      <KpiCard
        icon={Clock3}
        label="Tiempo cierre"
        value={formatCloseHours(summary.avgCloseHours)}
        hint="Promedio del equipo"
        accent="amber"
      />
    </View>
  </View>
);

const KpiCard = ({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: string;
  hint: string;
  accent: "primary" | "amber" | "emerald";
}) => {
  const iconClass =
    accent === "amber"
      ? "text-amber-700 dark:text-amber-300"
      : accent === "emerald"
        ? "text-emerald-700 dark:text-emerald-300"
        : "text-primary";
  const tintClass =
    accent === "amber"
      ? "bg-amber-500/10 border-amber-500/30"
      : accent === "emerald"
        ? "bg-emerald-500/10 border-emerald-500/30"
        : "bg-primary/10 border-primary/30";

  return (
    <View
      className={cn(
        "min-w-[30%] flex-1 gap-1.5 rounded-2xl border px-3 py-3",
        tintClass,
      )}>
      <View className="flex-row items-center gap-1.5">
        <Icon as={icon} size={14} className={iconClass} />
        <Text className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </Text>
      </View>
      <Text className="text-xl font-bold text-foreground">{value}</Text>
      <Text className="text-[11px] text-muted-foreground">{hint}</Text>
    </View>
  );
};

type CloseRateRingProps = {
  percent: number;
  size?: number;
};

export const CloseRateRing = ({ percent, size = 112 }: CloseRateRingProps) => {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? THEME.dark : THEME.light;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.muted}
            strokeWidth={stroke}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.primary}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View className="absolute items-center">
        <Text className="text-2xl font-bold text-foreground">{clamped}%</Text>
        <Text className="text-[10px] font-medium text-muted-foreground">
          cierre
        </Text>
      </View>
    </View>
  );
};

type TopTechniciansProps = {
  rows: SupervisorMetricRow[];
};

export const TopTechnicians = ({ rows }: TopTechniciansProps) => {
  const top = rows.slice(0, 3);
  if (top.length === 0) {
    return null;
  }

  const first = top[0];
  const second = top[1];
  const third = top[2];
  const podium: { row: SupervisorMetricRow; rank: number }[] = [];
  if (second) {
    podium.push({ row: second, rank: 2 });
  }
  if (first) {
    podium.push({ row: first, rank: 1 });
  }
  if (third) {
    podium.push({ row: third, rank: 3 });
  }

  return (
    <View className="gap-3 rounded-2xl border border-border/80 bg-card p-4">
      <View className="flex-row items-center gap-2">
        <Icon as={Award} size={18} className="text-primary" />
        <Text className="text-sm font-semibold text-foreground">
          Top técnicos
        </Text>
      </View>
      <Text className="text-xs text-muted-foreground">
        Según % de cierre, tickets resueltos y tiempo de cierre.
      </Text>

      <View className="mt-1 flex-row items-end justify-center gap-2">
        {podium.map(({ row, rank }) => {
          const heightClass =
            rank === 1 ? "h-28" : rank === 2 ? "h-24" : "h-20";
          return (
            <View
              key={row.technicianId}
              className="max-w-[31%] flex-1 items-center gap-2">
              <Text
                className="text-center text-xs font-semibold text-foreground"
                numberOfLines={2}>
                {row.name}
              </Text>
              <Text className="text-[11px] font-bold text-primary">
                {row.closeRatePct}%
              </Text>
              <View
                className={cn(
                  "w-full items-center justify-end rounded-t-xl border border-b-0 border-primary/30 bg-primary/15 px-1 pb-2 pt-3",
                  heightClass,
                )}>
                <Text className="text-lg font-bold text-primary">#{rank}</Text>
                <Text className="text-[10px] text-muted-foreground">
                  {row.closed} res.
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

type MetricBarChartProps = {
  title: string;
  subtitle: string;
  rows: SupervisorMetricRow[];
  valueOf: (row: SupervisorMetricRow) => number;
  formatValue: (value: number, row: SupervisorMetricRow) => string;
  emptyHint: string;
  barClassName?: string;
};

export const MetricBarChart = ({
  title,
  subtitle,
  rows,
  valueOf,
  formatValue,
  emptyHint,
  barClassName = "bg-primary",
}: MetricBarChartProps) => {
  const values = rows.map(valueOf);
  const max = Math.max(...values, 0);
  const hasData = max > 0;

  return (
    <View className="gap-3 rounded-2xl border border-border/80 bg-card p-4">
      <View className="gap-0.5">
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
        <Text className="text-xs text-muted-foreground">{subtitle}</Text>
      </View>

      {!hasData ? (
        <Text className="py-4 text-center text-sm text-muted-foreground">
          {emptyHint}
        </Text>
      ) : (
        <View className="gap-3">
          {rows.map((row) => {
            const value = valueOf(row);
            const ratio = max > 0 ? value / max : 0;
            const widthPct = Math.max(
              value > 0 ? 8 : 0,
              Math.round(ratio * 100),
            );

            return (
              <View key={row.technicianId} className="gap-1">
                <View className="flex-row items-center justify-between gap-2">
                  <Text
                    className="flex-1 text-xs font-medium text-foreground"
                    numberOfLines={1}>
                    {row.name}
                  </Text>
                  <Text className="text-xs font-semibold text-muted-foreground">
                    {formatValue(value, row)}
                  </Text>
                </View>
                <View className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <View
                    className={cn("h-full rounded-full", barClassName)}
                    style={{ width: `${widthPct}%` }}
                    accessibilityLabel={`${row.name}: ${formatValue(value, row)}`}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

type RankingListProps = {
  rows: SupervisorMetricRow[];
};

export const MetricsRankingList = ({ rows }: RankingListProps) => (
  <View className="gap-2">
    <View className="flex-row items-center gap-2 px-0.5">
      <Icon as={Ticket} size={16} className="text-muted-foreground" />
      <Text className="text-sm font-semibold text-foreground">
        Ranking completo
      </Text>
    </View>
    {rows.map((row, index) => (
      <View
        key={row.technicianId}
        className="gap-2 rounded-2xl border border-border/80 bg-card p-3.5">
        <View className="flex-row items-center justify-between gap-2">
          <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
            <View
              className={cn(
                "size-8 items-center justify-center rounded-full",
                index === 0
                  ? "bg-primary"
                  : index < 3
                    ? "bg-primary/15"
                    : "bg-secondary",
              )}>
              <Text
                className={cn(
                  "text-xs font-bold",
                  index === 0 ? "text-primary-foreground" : "text-foreground",
                )}>
                {index + 1}
              </Text>
            </View>
            <Text
              className="flex-1 text-sm font-semibold text-foreground"
              numberOfLines={1}>
              {row.name}
            </Text>
          </View>
          <Text className="text-xs font-bold text-primary">
            {row.closeRatePct}%
          </Text>
        </View>
        <View className="flex-row flex-wrap gap-x-3 gap-y-1 pl-10">
          <Text className="text-xs text-muted-foreground">
            Resueltos {row.closed}
          </Text>
          <Text className="text-xs text-muted-foreground">
            Pendientes {row.pending}
          </Text>
          <Text className="text-xs text-muted-foreground">
            Cierre {formatCloseHours(row.avgCloseHours)}
          </Text>
        </View>
      </View>
    ))}
  </View>
);
