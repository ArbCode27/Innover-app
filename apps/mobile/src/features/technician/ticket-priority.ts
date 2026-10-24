import type { CasoPriority } from "@/types/domain";

const PRIORITY_LABEL: Record<CasoPriority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};

/** Orden de cola: más urgente primero. */
const PRIORITY_RANK: Record<CasoPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const ticketPriorityLabel = (
  priority: CasoPriority,
  priorityLabel?: string | null,
) => {
  const fromServer = priorityLabel?.trim();
  return fromServer || PRIORITY_LABEL[priority];
};

export const ticketPriorityRank = (priority: CasoPriority) =>
  PRIORITY_RANK[priority];

/**
 * Colores con tokens/Tailwind que NativeWind resuelve bien
 * (mismo patrón que avisos de servicio).
 */
export const ticketPriorityChrome = (priority: CasoPriority) => {
  switch (priority) {
    case "urgent":
      return {
        bar: "bg-destructive",
        tint: "bg-destructive/10",
        border: "border-destructive/40",
        badge: "bg-destructive border-transparent",
        badgeText: "text-white",
        accentText: "text-destructive",
      };
    case "high":
      return {
        bar: "bg-amber-500",
        tint: "bg-amber-500/10",
        border: "border-amber-500/40",
        badge: "bg-amber-500 border-transparent",
        badgeText: "text-white",
        accentText: "text-amber-700 dark:text-amber-300",
      };
    case "low":
      return {
        bar: "bg-emerald-500",
        tint: "bg-emerald-500/10",
        border: "border-emerald-500/40",
        badge: "bg-emerald-500 border-transparent",
        badgeText: "text-white",
        accentText: "text-emerald-700 dark:text-emerald-300",
      };
    case "medium":
    default:
      return {
        bar: "bg-primary",
        tint: "bg-primary/10",
        border: "border-primary/35",
        badge: "bg-primary border-transparent",
        badgeText: "text-primary-foreground",
        accentText: "text-primary",
      };
  }
};
