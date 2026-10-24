import { ticketPriorityRank } from "@/features/technician/ticket-priority";
import type { AppCaso, TeamTicketFilter } from "@/types/domain";

export const TEAM_TICKET_FILTERS: TeamTicketFilter[] = [
  "pending",
  "done",
  "today",
];

/** Filtro de fecha (zona America/Caracas) sobre la ventana o cierre del caso. */
export type TeamDateFilter = "today" | "yesterday" | "week" | "all";

export const TEAM_DATE_FILTERS: TeamDateFilter[] = [
  "today",
  "yesterday",
  "week",
  "all",
];

export const UNASSIGNED_TECHNICIAN_KEY = "__unassigned__";

export type TeamTechnicianOption = {
  key: string;
  label: string;
  count: number;
};

export const teamFilterLabel = (filter: TeamTicketFilter) => {
  if (filter === "pending") {
    return "Pendientes";
  }
  if (filter === "done") {
    return "Resueltos";
  }
  return "Hoy";
};

export const teamDateFilterLabel = (filter: TeamDateFilter) => {
  if (filter === "today") {
    return "Hoy";
  }
  if (filter === "yesterday") {
    return "Ayer";
  }
  if (filter === "week") {
    return "7 días";
  }
  return "Todas";
};

export const getCaracasDateKey = (value: string | Date, offsetDays = 0) => {
  const date =
    value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setTime(date.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("es-VE", {
    timeZone: "America/Caracas",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export const todayCaracasKey = () => getCaracasDateKey(new Date());

const casoDateKey = (caso: AppCaso) => {
  if (caso.status === "done") {
    return getCaracasDateKey(caso.closedAt ?? caso.windowStart ?? "");
  }
  return getCaracasDateKey(caso.windowStart ?? "");
};

export const filterTeamTickets = (
  casos: AppCaso[],
  filter: TeamTicketFilter,
): AppCaso[] => {
  const today = todayCaracasKey();

  if (filter === "pending") {
    return casos.filter(
      (caso) => caso.status === "open" || caso.status === "scheduled",
    );
  }

  if (filter === "done") {
    return casos.filter((caso) => caso.status === "done");
  }

  return casos.filter((caso) => {
    const key = casoDateKey(caso);
    return key != null && today != null && key === today;
  });
};

export const filterTicketsByDate = (
  casos: AppCaso[],
  dateFilter: TeamDateFilter,
): AppCaso[] => {
  if (dateFilter === "all") {
    return casos;
  }

  const today = todayCaracasKey();
  if (dateFilter === "today") {
    return casos.filter((caso) => {
      const key = casoDateKey(caso);
      return key != null && today != null && key === today;
    });
  }

  if (dateFilter === "yesterday") {
    const yesterday = getCaracasDateKey(new Date(), -1);
    return casos.filter((caso) => {
      const key = casoDateKey(caso);
      return key != null && yesterday != null && key === yesterday;
    });
  }

  const weekKeys = new Set<string>();
  for (let offset = 0; offset < 7; offset += 1) {
    const key = getCaracasDateKey(new Date(), -offset);
    if (key) {
      weekKeys.add(key);
    }
  }
  return casos.filter((caso) => {
    const key = casoDateKey(caso);
    return key != null && weekKeys.has(key);
  });
};

export const technicianKeyForCaso = (caso: AppCaso) => {
  const id = caso.employeeId?.trim();
  if (id) {
    return id;
  }
  const name = caso.employeeName?.trim();
  if (name) {
    return `name:${name.toLocaleLowerCase("es")}`;
  }
  return UNASSIGNED_TECHNICIAN_KEY;
};

export const technicianLabelForCaso = (caso: AppCaso) =>
  caso.employeeName?.trim() || "Sin asignar";

export const listTechnicianOptions = (
  casos: AppCaso[],
): TeamTechnicianOption[] => {
  const map = new Map<string, TeamTechnicianOption>();
  for (const caso of casos) {
    const key = technicianKeyForCaso(caso);
    const current = map.get(key);
    if (current) {
      current.count += 1;
      continue;
    }
    map.set(key, {
      key,
      label: technicianLabelForCaso(caso),
      count: 1,
    });
  }

  return [...map.values()].sort((left, right) => {
    if (left.key === UNASSIGNED_TECHNICIAN_KEY) {
      return 1;
    }
    if (right.key === UNASSIGNED_TECHNICIAN_KEY) {
      return -1;
    }
    return left.label.localeCompare(right.label, "es", { sensitivity: "base" });
  });
};

export const filterTicketsByTechnician = (
  casos: AppCaso[],
  technicianKey: string | null,
): AppCaso[] => {
  if (!technicianKey) {
    return casos;
  }
  return casos.filter((caso) => technicianKeyForCaso(caso) === technicianKey);
};

export const sortTeamTickets = (casos: AppCaso[]): AppCaso[] =>
  [...casos].sort((left, right) => {
    const byPriority =
      ticketPriorityRank(left.priority) - ticketPriorityRank(right.priority);
    if (byPriority !== 0) {
      return byPriority;
    }
    const leftStart = left.windowStart ? Date.parse(left.windowStart) : NaN;
    const rightStart = right.windowStart ? Date.parse(right.windowStart) : NaN;
    if (!Number.isNaN(leftStart) && !Number.isNaN(rightStart)) {
      return leftStart - rightStart;
    }
    if (!Number.isNaN(leftStart)) {
      return -1;
    }
    if (!Number.isNaN(rightStart)) {
      return 1;
    }
    return technicianLabelForCaso(left).localeCompare(
      technicianLabelForCaso(right),
      "es",
      { sensitivity: "base" },
    );
  });

export const countTeamFilters = (casos: AppCaso[]) => ({
  pending: filterTeamTickets(casos, "pending").length,
  done: filterTeamTickets(casos, "done").length,
  today: filterTeamTickets(casos, "today").length,
});

export const countPriorityBreakdown = (casos: AppCaso[]) => {
  let urgent = 0;
  let high = 0;
  for (const caso of casos) {
    if (caso.priority === "urgent") {
      urgent += 1;
    } else if (caso.priority === "high") {
      high += 1;
    }
  }
  return { urgent, high, total: casos.length };
};

export const groupTicketsByTechnician = (casos: AppCaso[]) => {
  const groups = new Map<string, AppCaso[]>();
  for (const caso of casos) {
    const name = technicianLabelForCaso(caso);
    const current = groups.get(name) ?? [];
    current.push(caso);
    groups.set(name, current);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => {
      if (left === "Sin asignar") {
        return 1;
      }
      if (right === "Sin asignar") {
        return -1;
      }
      return left.localeCompare(right, "es", { sensitivity: "base" });
    })
    .map(([technicianName, tickets]) => ({
      technicianName,
      tickets: sortTeamTickets(tickets),
    }));
};
