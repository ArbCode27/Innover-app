import type { AppCaso, TeamTicketFilter } from "@/types/domain";

export const TEAM_TICKET_FILTERS: TeamTicketFilter[] = [
  "pending",
  "done",
  "today",
];

export const teamFilterLabel = (filter: TeamTicketFilter) => {
  if (filter === "pending") {
    return "Pendientes";
  }
  if (filter === "done") {
    return "Resueltos";
  }
  return "Hoy";
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

const casoDateKey = (caso: AppCaso, filter: TeamTicketFilter) => {
  if (filter === "done" || caso.status === "done") {
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
    const key = casoDateKey(caso, filter);
    return key != null && today != null && key === today;
  });
};

export const countTeamFilters = (casos: AppCaso[]) => ({
  pending: filterTeamTickets(casos, "pending").length,
  done: filterTeamTickets(casos, "done").length,
  today: filterTeamTickets(casos, "today").length,
});

export const groupTicketsByTechnician = (casos: AppCaso[]) => {
  const groups = new Map<string, AppCaso[]>();
  for (const caso of casos) {
    const name = caso.employeeName?.trim() || "Sin asignar";
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
    .map(([technicianName, tickets]) => ({ technicianName, tickets }));
};
