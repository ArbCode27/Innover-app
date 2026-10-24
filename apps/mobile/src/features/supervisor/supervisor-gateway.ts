import {
  mapCrmCasoRow,
  type CrmCasoRow,
} from "@/features/technician/caso-mapper";
import {
  MOCK_TECHNICIAN_DIRECTORY,
  listAllMockCasos,
} from "@/features/technician/technician-gateway";
import { countTeamFilters } from "@/features/supervisor/ticket-scope";
import { apiClient } from "@/lib/api-client";
import type { AppCaso, AppProfile, TeamTicketFilter } from "@/types/domain";

const isMockProfile = (profile: AppProfile | null) =>
  Boolean(profile?.userId.startsWith("mock-"));

const requireSupervisor = (profile: AppProfile | null) => {
  if (!profile || profile.role !== "supervisor") {
    throw new Error("Solo un supervisor puede ver el equipo.");
  }
};

const mapApiTickets = (rows: Record<string, unknown>[]): AppCaso[] =>
  rows
    .map((row) => mapCrmCasoRow(row as unknown as CrmCasoRow))
    .filter((caso): caso is AppCaso => caso !== null);

const statusForFilter = (filter: TeamTicketFilter) => {
  if (filter === "done") return "done";
  if (filter === "today") return "today";
  return "pending";
};

const managerIdsToExclude = (profile: AppProfile | null) => {
  const ids = new Set<string>();
  if (!profile) {
    return ids;
  }
  for (const value of [
    profile.supervisorId,
    profile.technicianId,
    profile.userId,
  ]) {
    const id = value?.trim();
    if (id) {
      ids.add(id);
    }
  }
  return ids;
};

const isSamePersonName = (left: string, right: string) =>
  left.trim().toLocaleLowerCase("es") === right.trim().toLocaleLowerCase("es");

export const fetchTeamSnapshot = async (profile: AppProfile | null) => {
  requireSupervisor(profile);
  if (isMockProfile(profile)) {
    const all = listAllMockCasos();
    return {
      tickets: all,
      counts: countTeamFilters(all),
    };
  }

  const [pending, done, today] = await Promise.all([
    apiClient.getSupervisorTickets({ status: "pending" }),
    apiClient.getSupervisorTickets({ status: "done" }),
    apiClient.getSupervisorTickets({ status: "today" }),
  ]);

  const tickets = mapApiTickets([
    ...(pending.tickets || []),
    ...(done.tickets || []),
  ]);
  // Deduplicate by id
  const byId = new Map(tickets.map((ticket) => [ticket.id, ticket]));
  const merged = [...byId.values()];

  return {
    tickets: merged,
    counts: {
      pending: (pending.tickets || []).length,
      done: (done.tickets || []).length,
      today: (today.tickets || []).length,
    },
  };
};

/** Detalle de lectura: busca en pending/done/today (API field_tickets). */
export const fetchSupervisorTicketDetail = async (
  profile: AppProfile | null,
  casoId: string,
): Promise<AppCaso | null> => {
  requireSupervisor(profile);
  if (!casoId) {
    return null;
  }

  if (isMockProfile(profile)) {
    const found = listAllMockCasos().find((caso) => caso.id === casoId) ?? null;
    return found ? { ...found } : null;
  }

  const filters: TeamTicketFilter[] = ["pending", "done", "today"];
  for (const filter of filters) {
    const payload = await apiClient.getSupervisorTickets({
      status: statusForFilter(filter),
    });
    const mapped = mapApiTickets(payload.tickets || []);
    const found = mapped.find((caso) => caso.id === casoId);
    if (found) {
      return found;
    }
  }
  return null;
};

export type SupervisorMetricRow = {
  technicianId: string;
  name: string;
  assigned: number;
  pending: number;
  closed: number;
  closeRatePct: number;
  avgCloseHours: number | null;
};

export const fetchSupervisorMetrics = async (
  profile: AppProfile | null,
  range: "today" | "7d" | "30d" = "7d",
): Promise<SupervisorMetricRow[]> => {
  requireSupervisor(profile);
  const excludedManagers = managerIdsToExclude(profile);
  const selfName = profile?.displayName?.trim() || "";

  if (isMockProfile(profile)) {
    const fieldTechs = MOCK_TECHNICIAN_DIRECTORY.filter(
      (entry) =>
        entry.id !== "mock-supervisor" && !excludedManagers.has(entry.id),
    );
    const mockByIndex: Omit<SupervisorMetricRow, "technicianId" | "name">[] = [
      {
        assigned: 10,
        pending: 2,
        closed: 8,
        closeRatePct: 80,
        avgCloseHours: 3.2,
      },
      {
        assigned: 8,
        pending: 3,
        closed: 5,
        closeRatePct: 63,
        avgCloseHours: 5.5,
      },
      {
        assigned: 6,
        pending: 1,
        closed: 5,
        closeRatePct: 83,
        avgCloseHours: 2.4,
      },
      {
        assigned: 4,
        pending: 2,
        closed: 2,
        closeRatePct: 50,
        avgCloseHours: 7.1,
      },
    ];
    return fieldTechs.map((entry, index) => {
      const sample = mockByIndex[index % mockByIndex.length] ?? {
        assigned: 0,
        pending: 0,
        closed: 0,
        closeRatePct: 0,
        avgCloseHours: null,
      };
      return {
        technicianId: entry.id,
        name: entry.name,
        ...sample,
      };
    });
  }

  const [payload, directoryPayload] = await Promise.all([
    apiClient.getSupervisorMetrics(range),
    apiClient.getSupervisorTechnicians(),
  ]);

  const fieldTechIds = new Set(
    (directoryPayload.technicians || [])
      .filter((item) => !item.is_supervisor)
      .map((item) => item.id),
  );

  return (payload.metrics || [])
    .map((row) => ({
      technicianId: row.technician_id,
      name: row.name,
      assigned: row.assigned,
      pending: row.pending,
      closed: row.closed,
      closeRatePct: row.close_rate_pct,
      avgCloseHours: row.avg_close_hours,
    }))
    .filter((row) => {
      if (excludedManagers.has(row.technicianId)) {
        return false;
      }
      if (selfName && isSamePersonName(row.name, selfName)) {
        return false;
      }
      // Si el directorio trae roles, solo técnicos de campo.
      if (fieldTechIds.size > 0 && !fieldTechIds.has(row.technicianId)) {
        return false;
      }
      return true;
    });
};
