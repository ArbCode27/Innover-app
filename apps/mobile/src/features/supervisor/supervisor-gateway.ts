import {
  CASO_SELECT_COLUMNS,
  mapCrmCasoRow,
  type CrmCasoRow,
} from "@/features/technician/caso-mapper";
import {
  MOCK_TECHNICIAN_DIRECTORY,
  listAllMockCasos,
} from "@/features/technician/technician-gateway";
import { lookupTechnicianAsTyped } from "@/features/supervisor/technician-name-lookup";
import {
  countTeamFilters,
  filterTeamTickets,
} from "@/features/supervisor/ticket-scope";
import { hasSupabasePublicEnv } from "@/lib/supabase-env";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type {
  AppCaso,
  AppProfile,
  TeamTicketFilter,
  TechnicianDirectoryEntry,
} from "@/types/domain";

const isMockProfile = (profile: AppProfile | null) =>
  Boolean(profile?.userId.startsWith("mock-"));

const requireSupervisor = (profile: AppProfile | null) => {
  if (!profile || profile.role !== "supervisor") {
    throw new Error("Solo un supervisor puede ver el equipo.");
  }
};

const uniqueDirectory = (entries: TechnicianDirectoryEntry[]) => {
  const byId = new Map<string, TechnicianDirectoryEntry>();
  for (const entry of entries) {
    const id = entry.id.trim();
    const name = entry.name.trim();
    if (!id || !name || byId.has(id)) {
      continue;
    }
    byId.set(id, { id, name });
  }
  return [...byId.values()];
};

const fetchRemoteDirectory = async (): Promise<TechnicianDirectoryEntry[]> => {
  const supabase = getSupabaseBrowserClient();
  const fromCatalog = await supabase
    .from("crm_technicians")
    .select("employee_id, name")
    .eq("active", true)
    .limit(500);
  const fromCasos = await supabase
    .from("crm_wispro_casos")
    .select("employee_id, employee_name")
    .not("employee_id", "is", null)
    .limit(500);

  const catalog = (fromCatalog.data ?? []).map((row) => ({
    id: String(row.employee_id ?? "").trim(),
    name: String(row.name ?? "").trim(),
  }));
  const casos = (fromCasos.data ?? []).map((row) => ({
    id: String(row.employee_id ?? "").trim(),
    name: String(row.employee_name ?? "").trim(),
  }));

  return uniqueDirectory([...catalog, ...casos]);
};

export const fetchTechnicianDirectory = async (
  profile: AppProfile | null,
): Promise<TechnicianDirectoryEntry[]> => {
  requireSupervisor(profile);
  if (isMockProfile(profile) || !hasSupabasePublicEnv()) {
    return MOCK_TECHNICIAN_DIRECTORY.map((entry) => ({ ...entry }));
  }
  return fetchRemoteDirectory();
};

const fetchRemoteTeamCasos = async (): Promise<AppCaso[]> => {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("crm_wispro_casos")
    .select(CASO_SELECT_COLUMNS)
    .in("status", ["open", "scheduled", "done"])
    .order("employee_name", { ascending: true, nullsFirst: false })
    .order("window_start", { ascending: true, nullsFirst: false })
    .limit(200);

  if (error) {
    throw new Error(error.message || "No se pudo cargar el equipo.");
  }

  return (data ?? [])
    .map((row) => mapCrmCasoRow(row as CrmCasoRow))
    .filter((caso): caso is AppCaso => caso !== null);
};

const loadTeamCasos = async (profile: AppProfile | null): Promise<AppCaso[]> => {
  requireSupervisor(profile);
  if (isMockProfile(profile) || !hasSupabasePublicEnv()) {
    return listAllMockCasos();
  }
  return fetchRemoteTeamCasos();
};

export const fetchTeamSnapshot = async (profile: AppProfile | null) => {
  const all = await loadTeamCasos(profile);
  return {
    tickets: all,
    counts: countTeamFilters(all),
  };
};

export const fetchTeamTickets = async (
  profile: AppProfile | null,
  filter: TeamTicketFilter,
): Promise<AppCaso[]> => {
  const snapshot = await fetchTeamSnapshot(profile);
  return filterTeamTickets(snapshot.tickets, filter);
};

export const fetchSupervisorOwnQueue = async (
  profile: AppProfile | null,
  filter: TeamTicketFilter,
): Promise<AppCaso[]> => {
  requireSupervisor(profile);
  const employeeId = profile?.supervisorId;
  if (!employeeId) {
    return [];
  }
  const all = await loadTeamCasos(profile);
  return filterTeamTickets(all, filter).filter(
    (caso) => caso.employeeId === employeeId,
  );
};

export const fetchTechnicianTicketsForSupervisor = async (
  profile: AppProfile | null,
  employeeId: string,
  filter: TeamTicketFilter,
): Promise<AppCaso[]> => {
  requireSupervisor(profile);
  const all = await loadTeamCasos(profile);
  return filterTeamTickets(all, filter).filter(
    (caso) => caso.employeeId === employeeId,
  );
};

export const searchTechnicianAsTyped = async (
  profile: AppProfile | null,
  query: string,
) => {
  const directory = await fetchTechnicianDirectory(profile);
  return lookupTechnicianAsTyped(directory, query);
};
