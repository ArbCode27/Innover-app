import type { AppCaso, CasoStatus } from "@/types/domain";

export type CrmCasoRow = {
  id: string;
  wispro_issue_id?: string | null;
  wispro_public_id: number | null;
  title: string;
  cause?: string | null;
  status: string;
  priority?: string | null;
  client_name: string | null;
  client_phone?: string | null;
  maps_url: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address_text?: string | null;
  window_start: string | null;
  window_end: string | null;
  facade_media_url: string | null;
  resolution_observation: string | null;
  employee_id?: string | null;
  employee_name?: string | null;
  closed_at?: string | null;
};

const isCasoStatus = (value: string): value is CasoStatus =>
  value === "open" ||
  value === "scheduled" ||
  value === "done" ||
  value === "cancelled";

export const CASO_SELECT_COLUMNS =
  "id, wispro_issue_id, wispro_public_id, title, cause, status, priority, client_name, client_phone, maps_url, latitude, longitude, address_text, window_start, window_end, facade_media_url, resolution_observation, employee_id, employee_name, closed_at";

export const mapCrmCasoRow = (row: CrmCasoRow): AppCaso | null => {
  if (!isCasoStatus(row.status)) {
    return null;
  }

  return {
    id: row.id,
    wisproIssueId: row.wispro_issue_id ?? null,
    wisproPublicId: row.wispro_public_id,
    title: row.title,
    cause: row.cause ?? null,
    status: row.status,
    priority:
      row.priority === "low" ||
      row.priority === "high" ||
      row.priority === "urgent"
        ? row.priority
        : "medium",
    clientName: row.client_name,
    clientPhone: row.client_phone ?? null,
    mapsUrl: row.maps_url,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    addressText: row.address_text ?? null,
    windowStart: row.window_start,
    windowEnd: row.window_end,
    facadeMediaUrl: row.facade_media_url,
    resolutionObservation: row.resolution_observation,
    employeeId: row.employee_id ?? null,
    employeeName: row.employee_name ?? null,
    closedAt: row.closed_at ?? null,
  };
};
