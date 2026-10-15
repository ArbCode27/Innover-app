import {
  CASO_SELECT_COLUMNS,
  mapCrmCasoRow,
  type CrmCasoRow,
} from "@/features/technician/caso-mapper";
import { hasSupabasePublicEnv } from "@/lib/supabase-env";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { AppCaso, AppProfile } from "@/types/domain";

/**
 * Ticket mockeado representativo para pruebas del canal cliente.
 * "esto no existe en el CRM; hay que crearlo" (ver docs/BACKEND_GAPS.md).
 */
export const MOCK_CUSTOMER_TICKET: AppCaso = {
  id: "caso-4082",
  wisproIssueId: "issue-9921",
  wisproPublicId: 4082,
  title: "Atenuación óptica en sector Valencia",
  cause: "Atenuación en conector de caja NAP residencial",
  status: "open",
  priority: "medium",
  clientName: "Carlos Silva",
  clientPhone: "04120000000",
  mapsUrl: "https://maps.google.com/?q=10.18,-68.00",
  latitude: 10.18,
  longitude: -68.00,
  addressText: "Urb. El Parral, Calle Los Almendros, Valencia",
  windowStart: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
  windowEnd: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
  facadeMediaUrl: null,
  resolutionObservation: null,
  employeeId: "tech-1",
  employeeName: "Jesús Rojas",
  closedAt: null,
};

export const fetchCustomerOpenTicket = async (
  profile: AppProfile | null,
): Promise<AppCaso | null> => {
  if (!profile || profile.role !== "customer") {
    return null;
  }

  // Si no hay Supabase público configurado o es un perfil de prueba mock, devolvemos el caso mockeado
  if (!hasSupabasePublicEnv() || profile.userId.startsWith("mock-")) {
    return MOCK_CUSTOMER_TICKET;
  }

  if (profile.clientId == null) {
    return null;
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("crm_wispro_casos")
      .select(CASO_SELECT_COLUMNS)
      .eq("crm_client_id", profile.clientId)
      .in("status", ["open", "scheduled"])
      .not("wispro_public_id", "is", null)
      .order("window_start", { ascending: true, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const mapped = mapCrmCasoRow(data as CrmCasoRow);
    if (!mapped || mapped.wisproPublicId == null) {
      return null;
    }
    return mapped;
  } catch {
    return MOCK_CUSTOMER_TICKET;
  }
};
