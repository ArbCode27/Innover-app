import type { SupervisorMetricRow } from "@/features/supervisor/supervisor-gateway";

export type TeamMetricsSummary = {
  totalAssigned: number;
  totalPending: number;
  totalClosed: number;
  teamCloseRatePct: number;
  /** Promedio ponderado por tickets cerrados; null si no hay cierres con tiempo. */
  avgCloseHours: number | null;
};

/** Ranking: % cierre ↓, cerrados ↓, tiempo de cierre ↑ (más rápido primero). */
export const rankMetricRows = (
  rows: SupervisorMetricRow[],
): SupervisorMetricRow[] =>
  [...rows].sort((left, right) => {
    if (right.closeRatePct !== left.closeRatePct) {
      return right.closeRatePct - left.closeRatePct;
    }
    if (right.closed !== left.closed) {
      return right.closed - left.closed;
    }
    const leftHours = left.avgCloseHours;
    const rightHours = right.avgCloseHours;
    if (leftHours == null && rightHours == null) {
      return left.name.localeCompare(right.name, "es", { sensitivity: "base" });
    }
    if (leftHours == null) {
      return 1;
    }
    if (rightHours == null) {
      return -1;
    }
    if (leftHours !== rightHours) {
      return leftHours - rightHours;
    }
    return left.name.localeCompare(right.name, "es", { sensitivity: "base" });
  });

export const summarizeTeamMetrics = (
  rows: SupervisorMetricRow[],
): TeamMetricsSummary => {
  let totalAssigned = 0;
  let totalPending = 0;
  let totalClosed = 0;
  let weightedHours = 0;
  let hoursWeight = 0;

  for (const row of rows) {
    totalAssigned += row.assigned;
    totalPending += row.pending;
    totalClosed += row.closed;
    if (row.avgCloseHours != null && row.closed > 0) {
      weightedHours += row.avgCloseHours * row.closed;
      hoursWeight += row.closed;
    }
  }

  const teamCloseRatePct =
    totalAssigned > 0
      ? Math.round((totalClosed / totalAssigned) * 100)
      : 0;

  return {
    totalAssigned,
    totalPending,
    totalClosed,
    teamCloseRatePct,
    avgCloseHours:
      hoursWeight > 0
        ? Math.round((weightedHours / hoursWeight) * 10) / 10
        : null,
  };
};

export const formatCloseHours = (hours: number | null) => {
  if (hours == null) {
    return "—";
  }
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`;
  }
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  if (minutes === 0) {
    return `${whole} h`;
  }
  return `${whole} h ${minutes} min`;
};
