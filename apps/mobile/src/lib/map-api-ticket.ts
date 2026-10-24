import type { ApiTicket } from "@/types/app-channel";
import type { AppCaso, CasoPriority, CasoStatus } from "@/types/domain";

const isCasoStatus = (value: string): value is CasoStatus =>
  value === "open" ||
  value === "scheduled" ||
  value === "done" ||
  value === "cancelled";

const isCasoPriority = (value: string): value is CasoPriority =>
  value === "low" ||
  value === "medium" ||
  value === "high" ||
  value === "urgent";

const normalizePriority = (value: unknown): CasoPriority => {
  if (typeof value !== "string") {
    return "medium";
  }
  const raw = value.trim().toLowerCase();
  if (isCasoPriority(raw)) {
    return raw;
  }
  if (raw === "baja" || raw === "low") {
    return "low";
  }
  if (raw === "media" || raw === "normal" || raw === "medium") {
    return "medium";
  }
  if (raw === "alta" || raw === "high") {
    return "high";
  }
  if (raw === "urgente" || raw === "urgent" || raw === "critica" || raw === "crítica") {
    return "urgent";
  }
  return "medium";
};

export const mapApiTicket = (row: ApiTicket): AppCaso => {
  const status = isCasoStatus(row.status) ? row.status : "open";
  const statusLabel =
    (typeof row.status_label === "string" && row.status_label.trim()) ||
    (isCasoStatus(row.status) ? null : String(row.status));

  return {
    id: row.id,
    wisproIssueId: null,
    wisproPublicId: row.public_id,
    title: row.title,
    cause: row.cause,
    status,
    priority: normalizePriority(row.priority),
    clientName: null,
    clientPhone: null,
    mapsUrl: row.maps_url,
    latitude: row.latitude,
    longitude: row.longitude,
    addressText: row.address,
    windowStart: row.window_start,
    windowEnd: row.window_end,
    facadeMediaUrl: null,
    resolutionObservation: row.resolution,
    employeeId: null,
    employeeName: row.technician?.name ?? null,
    closedAt: row.closed_at,
    technicianPhone: row.technician?.phone ?? null,
    description: row.description ?? null,
    kindLabel: row.kind_label ?? null,
    statusLabel,
    priorityLabel: row.priority_label ?? null,
  };
};
