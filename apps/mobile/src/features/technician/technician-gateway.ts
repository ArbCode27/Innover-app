import {
  mapCrmCasoRow,
  type CrmCasoRow,
} from "@/features/technician/caso-mapper";
import { CLOSE_OBSERVATION_MAX_CHARS } from "@/features/technician/close-observation-transcribe";
import { apiClient } from "@/lib/api-client";
import { mapApiTicket } from "@/lib/map-api-ticket";
import type { ApiTicket } from "@/types/app-channel";
import type { AppCaso, AppProfile } from "@/types/domain";

export const TECHNICIAN_QUEUE_PAGE_SIZE = 8;

const isMockProfile = (profile: AppProfile | null) =>
  Boolean(profile?.userId.startsWith("mock-"));

const cloneCaso = (caso: AppCaso): AppCaso => ({ ...caso });

const ownPending = (casos: AppCaso[], employeeId: string) =>
  casos.filter(
    (caso) =>
      caso.employeeId === employeeId &&
      (caso.status === "open" || caso.status === "scheduled"),
  );

const ownResolved = (casos: AppCaso[], employeeId: string) =>
  casos.filter(
    (caso) => caso.employeeId === employeeId && caso.status === "done",
  );

let mockCasos: AppCaso[] = [
  {
    id: "mock-caso-1",
    wisproIssueId: "mock-issue-1",
    wisproPublicId: null,
    title: "Visita técnica",
    cause: "Sin internet",
    status: "scheduled",
    priority: "urgent",
    clientName: "María López",
    clientPhone: null,
    mapsUrl: "https://maps.google.com/?q=10.1621,-68.0077",
    latitude: 10.1621,
    longitude: -68.0077,
    addressText: "Valencia · San Blas",
    windowStart: "2026-10-08T13:00:00.000Z",
    windowEnd: "2026-10-08T15:00:00.000Z",
    facadeMediaUrl: null,
    resolutionObservation: null,
    employeeId: "mock-technician",
    employeeName: "José Pérez",
    closedAt: null,
  },
  {
    id: "mock-caso-2",
    wisproIssueId: "mock-issue-2",
    wisproPublicId: null,
    title: "Cambio de ONU",
    cause: "Potencia baja",
    status: "open",
    priority: "medium",
    clientName: "Carlos Ruiz",
    clientPhone: null,
    mapsUrl: null,
    latitude: 10.186,
    longitude: -67.998,
    addressText: "Valencia · El Viñedo",
    windowStart: null,
    windowEnd: null,
    facadeMediaUrl: null,
    resolutionObservation: null,
    employeeId: "mock-technician",
    employeeName: "José Pérez",
    closedAt: null,
  },
  {
    id: "mock-caso-3",
    wisproIssueId: "mock-issue-3",
    wisproPublicId: null,
    title: "Revisión de acometida",
    cause: "Corte intermitente",
    status: "scheduled",
    priority: "medium",
    clientName: "Ana Rivas",
    clientPhone: null,
    mapsUrl: null,
    latitude: null,
    longitude: null,
    addressText: "Valencia · Naguanagua",
    windowStart: "2026-10-10T12:00:00.000Z",
    windowEnd: "2026-10-10T14:00:00.000Z",
    facadeMediaUrl: null,
    resolutionObservation: null,
    employeeId: "mock-technician",
    employeeName: "José Pérez",
    closedAt: null,
  },
  {
    id: "mock-caso-4",
    wisproIssueId: "mock-issue-4",
    wisproPublicId: null,
    title: "Instalación",
    cause: "Nueva instalación",
    status: "open",
    priority: "low",
    clientName: "Pedro Salas",
    clientPhone: null,
    mapsUrl: null,
    latitude: null,
    longitude: null,
    addressText: "Valencia · La Viña",
    windowStart: null,
    windowEnd: null,
    facadeMediaUrl: null,
    resolutionObservation: null,
    employeeId: "mock-technician",
    employeeName: "José Pérez",
    closedAt: null,
  },
  {
    id: "mock-caso-5",
    wisproIssueId: "mock-issue-5",
    wisproPublicId: null,
    title: "Visita técnica",
    cause: "Lentitud",
    status: "scheduled",
    priority: "medium",
    clientName: "Luisa Méndez",
    clientPhone: null,
    mapsUrl: null,
    latitude: null,
    longitude: null,
    addressText: "Valencia · San Diego",
    windowStart: "2026-10-11T13:00:00.000Z",
    windowEnd: "2026-10-11T15:00:00.000Z",
    facadeMediaUrl: null,
    resolutionObservation: null,
    employeeId: "mock-technician",
    employeeName: "José Pérez",
    closedAt: null,
  },
  {
    id: "mock-caso-6",
    wisproIssueId: "mock-issue-6",
    wisproPublicId: null,
    title: "Cambio de drop",
    cause: "Drop dañado",
    status: "open",
    priority: "high",
    clientName: "Jorge Peña",
    clientPhone: null,
    mapsUrl: null,
    latitude: null,
    longitude: null,
    addressText: "Valencia · El Trigal",
    windowStart: null,
    windowEnd: null,
    facadeMediaUrl: null,
    resolutionObservation: null,
    employeeId: "mock-technician",
    employeeName: "José Pérez",
    closedAt: null,
  },
  {
    id: "mock-caso-7",
    wisproIssueId: "mock-issue-7",
    wisproPublicId: null,
    title: "Visita técnica",
    cause: "Sin navegación",
    status: "scheduled",
    priority: "medium",
    clientName: "Elena Díaz",
    clientPhone: null,
    mapsUrl: null,
    latitude: null,
    longitude: null,
    addressText: "Valencia · Prebo",
    windowStart: "2026-10-12T12:00:00.000Z",
    windowEnd: "2026-10-12T14:00:00.000Z",
    facadeMediaUrl: null,
    resolutionObservation: null,
    employeeId: "mock-technician",
    employeeName: "José Pérez",
    closedAt: null,
  },
  {
    id: "mock-caso-8",
    wisproIssueId: "mock-issue-8",
    wisproPublicId: null,
    title: "Reconexión",
    cause: "Servicio suspendido",
    status: "open",
    priority: "medium",
    clientName: "Raúl Ortega",
    clientPhone: null,
    mapsUrl: null,
    latitude: null,
    longitude: null,
    addressText: "Valencia · Los Guayos",
    windowStart: null,
    windowEnd: null,
    facadeMediaUrl: null,
    resolutionObservation: null,
    employeeId: "mock-technician",
    employeeName: "José Pérez",
    closedAt: null,
  },
  {
    id: "mock-caso-9",
    wisproIssueId: "mock-issue-9",
    wisproPublicId: null,
    title: "Visita técnica",
    cause: "Wifi inestable",
    status: "scheduled",
    priority: "low",
    clientName: "Sofía Herrera",
    clientPhone: null,
    mapsUrl: null,
    latitude: null,
    longitude: null,
    addressText: "Valencia · Mañongo",
    windowStart: null,
    windowEnd: null,
    facadeMediaUrl: null,
    resolutionObservation: null,
    employeeId: "mock-technician",
    employeeName: "José Pérez",
    closedAt: null,
  },
  {
    id: "mock-caso-other",
    wisproIssueId: "mock-issue-other",
    wisproPublicId: null,
    title: "Visita técnica",
    cause: "Sin señal",
    status: "scheduled",
    priority: "medium",
    clientName: "Cliente ajeno",
    clientPhone: null,
    mapsUrl: null,
    latitude: null,
    longitude: null,
    addressText: "Otra zona",
    windowStart: null,
    windowEnd: null,
    facadeMediaUrl: null,
    resolutionObservation: null,
    employeeId: "other-technician",
    employeeName: "José Ramírez",
    closedAt: null,
  },
  {
    id: "mock-caso-supervisor",
    wisproIssueId: "mock-issue-supervisor",
    wisproPublicId: null,
    title: "Visita técnica",
    cause: "Revisión de nodo",
    status: "scheduled",
    priority: "medium",
    clientName: "Daniela Soto",
    clientPhone: null,
    mapsUrl: null,
    latitude: null,
    longitude: null,
    addressText: "Valencia · El Recreo",
    windowStart: "2026-10-08T14:00:00.000Z",
    windowEnd: "2026-10-08T16:00:00.000Z",
    facadeMediaUrl: null,
    resolutionObservation: null,
    employeeId: "mock-supervisor",
    employeeName: "Alan Rivas",
    closedAt: null,
  },
  {
    id: "mock-caso-done-today",
    wisproIssueId: "mock-issue-done-today",
    wisproPublicId: null,
    title: "Cambio de conector",
    cause: "Pérdida óptica",
    status: "done",
    priority: "medium",
    clientName: "Héctor Silva",
    clientPhone: null,
    mapsUrl: null,
    latitude: null,
    longitude: null,
    addressText: "Valencia · San Blas",
    windowStart: "2026-10-08T11:00:00.000Z",
    windowEnd: "2026-10-08T13:00:00.000Z",
    facadeMediaUrl: null,
    resolutionObservation: "Se cambió el conector y quedó operativo.",
    employeeId: "mock-technician",
    employeeName: "José Pérez",
    closedAt: "2026-10-08T18:30:00.000Z",
  },
];

export const MOCK_TECHNICIAN_DIRECTORY = [
  { id: "mock-technician", name: "José Pérez" },
  { id: "other-technician", name: "José Ramírez" },
  { id: "mock-supervisor", name: "Alan Rivas" },
] as const;

export const listAllMockCasos = (): AppCaso[] => mockCasos.map(cloneCaso);

const requireOwnEmployeeId = (profile: AppProfile | null) => {
  if (!profile || profile.role !== "technician" || !profile.technicianId) {
    throw new Error("Solo un técnico puede ver o cerrar su cola.");
  }
  return profile.technicianId;
};

const mapApiTicketRow = (row: Record<string, unknown>): AppCaso | null => {
  // Respuesta app-channel (`priority`, `public_id`, `address`…).
  if (
    typeof row.id === "string" &&
    typeof row.title === "string" &&
    ("priority" in row || "public_id" in row || "address" in row)
  ) {
    const mapped = mapApiTicket(row as unknown as ApiTicket);
    const clientName =
      (typeof row.client_name === "string" && row.client_name.trim()) ||
      (typeof row.clientName === "string" && row.clientName.trim()) ||
      mapped.clientName;
    const addressText =
      mapped.addressText?.trim() ||
      (typeof row.address_text === "string" && row.address_text.trim()) ||
      null;
    return {
      ...mapped,
      clientName: clientName || null,
      addressText: addressText || mapped.addressText,
      employeeId:
        mapped.employeeId ??
        (typeof row.employee_id === "string" ? row.employee_id : null),
    };
  }

  // Forma CRM legado (`wispro_public_id`, `address_text`…).
  return mapCrmCasoRow(row as unknown as CrmCasoRow);
};

const fetchApiTickets = async (includeDone = false): Promise<AppCaso[]> => {
  const payload = await apiClient.getTechnicianTickets({ includeDone });
  return (payload.tickets || [])
    .map((row) => mapApiTicketRow(row))
    .filter((caso): caso is AppCaso => caso !== null);
};

export const fetchTechnicianQueue = async (
  profile: AppProfile | null,
): Promise<AppCaso[]> => {
  const employeeId = requireOwnEmployeeId(profile);

  if (isMockProfile(profile)) {
    return ownPending(mockCasos, employeeId).map(cloneCaso);
  }

  // Fuente de verdad: GET /api/app/technician/tickets (field_tickets).
  const tickets = await fetchApiTickets(false);
  return tickets.filter(
    (caso) => caso.status === "open" || caso.status === "scheduled",
  );
};

export const fetchTechnicianResolved = async (
  profile: AppProfile | null,
): Promise<AppCaso[]> => {
  const employeeId = requireOwnEmployeeId(profile);

  if (isMockProfile(profile)) {
    return ownResolved(mockCasos, employeeId)
      .map(cloneCaso)
      .sort((left, right) => {
        const leftAt = left.closedAt ?? "";
        const rightAt = right.closedAt ?? "";
        return rightAt.localeCompare(leftAt);
      });
  }

  const tickets = await fetchApiTickets(true);
  return tickets
    .filter((caso) => caso.status === "done")
    .sort((left, right) => {
      const leftAt = left.closedAt ?? "";
      const rightAt = right.closedAt ?? "";
      return rightAt.localeCompare(leftAt);
    });
};

export const fetchTechnicianCaso = async (
  profile: AppProfile | null,
  casoId: string | undefined,
): Promise<AppCaso | null> => {
  if (!casoId) {
    return null;
  }
  const employeeId = requireOwnEmployeeId(profile);

  if (isMockProfile(profile)) {
    const found = mockCasos.find((caso) => caso.id === casoId) ?? null;
    if (!found || found.employeeId !== employeeId) {
      return null;
    }
    return cloneCaso(found);
  }

  const payload = await apiClient.getTechnicianTicket(casoId);
  const mapped = mapApiTicketRow(payload.ticket);
  if (!mapped || mapped.employeeId !== employeeId) {
    return null;
  }
  return mapped;
};

export type CloseVisitInput = {
  casoId: string;
  observation: string;
};

export const closeTechnicianVisit = async (
  profile: AppProfile | null,
  input: CloseVisitInput,
): Promise<AppCaso> => {
  const employeeId = requireOwnEmployeeId(profile);
  const observation = input.observation.trim();
  if (observation.length < 3) {
    throw new Error(
      "Escribe al menos 3 caracteres en la observación para cerrar la visita.",
    );
  }
  if (observation.length > CLOSE_OBSERVATION_MAX_CHARS) {
    throw new Error(
      `La observación no puede pasar de ${CLOSE_OBSERVATION_MAX_CHARS} caracteres. Acórtala e inténtalo de nuevo.`,
    );
  }

  if (isMockProfile(profile)) {
    const index = mockCasos.findIndex((caso) => caso.id === input.casoId);
    const existing = index >= 0 ? mockCasos[index] : null;
    if (!existing || existing.employeeId !== employeeId) {
      throw new Error("Ese ticket no está asignado a ti.");
    }
    if (existing.status === "done" || existing.status === "cancelled") {
      throw new Error("Este ticket ya está cerrado.");
    }
    const closed: AppCaso = {
      ...existing,
      status: "done",
      resolutionObservation: observation,
      closedAt: new Date().toISOString(),
    };
    mockCasos = mockCasos.map((caso, casoIndex) =>
      casoIndex === index ? closed : caso,
    );
    return cloneCaso(closed);
  }

  const payload = await apiClient.closeTechnicianTicket(
    input.casoId,
    observation,
  );
  const mapped = mapApiTicketRow(payload.ticket);
  if (!mapped) {
    throw new Error("No se pudo leer el ticket cerrado.");
  }
  return mapped;
};
