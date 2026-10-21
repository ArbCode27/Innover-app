import type { InnoverIconTone } from "@/components/brand-logo";
import type { ServiceNoticeKind, ServiceNoticeSeverity } from "@/types/domain";

export type NoticeChrome = {
  tone: InnoverIconTone;
  card: string;
  iconWrap: string;
  title: string;
  badge: string;
  label: string;
};

const CHROME: Record<ServiceNoticeSeverity, NoticeChrome> = {
  critical: {
    tone: "critical",
    card: "border-destructive/40 bg-destructive/10",
    iconWrap: "bg-destructive/20",
    title: "text-destructive",
    badge: "bg-destructive",
    label: "Alerta",
  },
  warning: {
    tone: "warning",
    card: "border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/20",
    iconWrap: "bg-amber-500/20",
    title: "text-amber-700 dark:text-amber-300",
    badge: "bg-amber-500",
    label: "Advertencia",
  },
  info: {
    tone: "info",
    card: "border-primary/30 bg-primary/10",
    iconWrap: "bg-primary/20",
    title: "text-primary",
    badge: "bg-primary",
    label: "Comunicado",
  },
  success: {
    tone: "success",
    card: "border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/20",
    iconWrap: "bg-emerald-500/20",
    title: "text-emerald-700 dark:text-emerald-300",
    badge: "bg-emerald-500",
    label: "Restablecido",
  },
};

export const chromeForSeverity = (severity: ServiceNoticeSeverity): NoticeChrome =>
  CHROME[severity];

export const SIMULATOR_LABEL: Record<ServiceNoticeKind, string> = {
  fiber_cut: "Corte de fibra",
  power_warning: "Potencia alterada",
  zone_work: "Trabajo en zona",
  service_restored: "Trabajo listo",
};

export const severityRank = (severity: ServiceNoticeSeverity) => {
  if (severity === "critical") {
    return 3;
  }
  if (severity === "warning") {
    return 2;
  }
  if (severity === "info") {
    return 1;
  }
  return 0;
};

export type HomeLinkState =
  | "active"
  | "billing_cut"
  | "fiber_cut"
  | "power_warning"
  | "zone_work"
  | "restored";

export const resolveHomeLinkState = (
  kind: ServiceNoticeKind | undefined,
  serviceSuspended: boolean,
): HomeLinkState => {
  if (kind === "fiber_cut") {
    return "fiber_cut";
  }
  if (kind === "power_warning") {
    return "power_warning";
  }
  if (kind === "zone_work") {
    return "zone_work";
  }
  if (kind === "service_restored") {
    return "restored";
  }
  if (serviceSuspended) {
    return "billing_cut";
  }
  return "active";
};

export const highestSeverity = (
  severities: ServiceNoticeSeverity[],
): ServiceNoticeSeverity | null => {
  if (severities.length === 0) {
    return null;
  }
  return severities.reduce((top, current) =>
    severityRank(current) > severityRank(top) ? current : top,
  );
};
