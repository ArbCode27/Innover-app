import { apiClient, ApiError } from "@/lib/api-client";
import { hasChannelSecret, hasOrganizationSlug, ORGANIZATION_SLUG } from "@/lib/app-env";
import type { AppChannelSession, CreateSessionInput } from "@/types/app-channel";

export type OpenSessionInput = {
  phone: string;
  name?: string;
  organizationSlug?: string;
};

export type OpenSessionResult =
  | { ok: true; session: AppChannelSession }
  | { ok: false; message: string };

export type LoginWithCedulaInput = {
  cedula: string;
  password: string;
  organizationSlug?: string;
};

export type LoginWithCedulaResult =
  | { ok: true; session: AppChannelSession }
  | { ok: false; message: string };

export type RequestGeneratedKeyInput = {
  cedula: string;
  phone?: string;
  organizationSlug?: string;
};

export type RequestGeneratedKeyResult =
  | { ok: true; key: string; message: string }
  | { ok: false; message: string };

/**
 * Almacén en memoria de claves autogeneradas para desarrollo y pruebas mock.
 * "esto no existe en el CRM; hay que crearlo" (ver docs/BACKEND_GAPS.md).
 */
const generatedKeysStore = new Map<string, string>();

const normalizeCedula = (cedula: string) => cedula.replace(/\D/g, "");

export const requestGeneratedKey = async (
  input: RequestGeneratedKeyInput,
): Promise<RequestGeneratedKeyResult> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const cedulaDigits = normalizeCedula(input.cedula);
  if (cedulaDigits.length < 6 || cedulaDigits.length > 10) {
    return {
      ok: false,
      message: "Ingresa una cédula válida (entre 6 y 10 dígitos numéricos).",
    };
  }

  // Genera un código automático de 6 dígitos numéricos
  const randomSixDigits = Math.floor(100000 + Math.random() * 900000).toString();
  generatedKeysStore.set(cedulaDigits, randomSixDigits);

  return {
    ok: true,
    key: randomSixDigits,
    message: `Clave generada con éxito para la cédula ${cedulaDigits}. En producción el backend la envía por SMS o WhatsApp al contacto de tu contrato.`,
  };
};

export const loginWithCedulaAndPassword = async (
  input: LoginWithCedulaInput,
): Promise<LoginWithCedulaResult> => {
  await new Promise((resolve) => setTimeout(resolve, 350));

  const cedulaDigits = normalizeCedula(input.cedula);
  if (cedulaDigits.length < 6 || cedulaDigits.length > 10) {
    return {
      ok: false,
      message: "Ingresa una cédula válida (entre 6 y 10 dígitos numéricos).",
    };
  }

  const password = input.password.trim();
  if (password.length < 4) {
    return {
      ok: false,
      message: "Ingresa la clave generada por el backend (mínimo 4 caracteres).",
    };
  }

  // Si existe una clave generada en memoria para esta cédula, validamos coincidencia
  const storedKey = generatedKeysStore.get(cedulaDigits);
  if (storedKey && storedKey !== password) {
    return {
      ok: false,
      message:
        "La clave ingresada no coincide con la generada para esta cédula. Revisa o genera una nueva.",
    };
  }

  const organizationSlug = (
    hasOrganizationSlug() ? ORGANIZATION_SLUG : input.organizationSlug ?? "innover"
  ).trim();

  // "esto no existe en el CRM; hay que crearlo" - Mock de sesión con cédula real
  const mockSession: AppChannelSession = {
    token: `mock-jwt-customer-${cedulaDigits}`,
    organization: {
      id: "org-innover",
      name: "Conexiones Innover",
      slug: organizationSlug,
    },
    client: {
      id: 1001,
      name: "Abonado Innover",
      phone: "584120000000",
      cedula: cedulaDigits,
    },
    conversation: {
      id: 9001,
      status: "abierto",
      humanMode: false,
    },
  };

  return {
    ok: true,
    session: mockSession,
  };
};

export const openAppSession = async (
  input: OpenSessionInput,
): Promise<OpenSessionResult> => {
  if (!hasChannelSecret()) {
    return {
      ok: false,
      message:
        "Falta configurar el canal. Completa las variables de entorno de la app.",
    };
  }

  const organizationSlug = (
    hasOrganizationSlug() ? ORGANIZATION_SLUG : input.organizationSlug ?? ""
  ).trim();
  if (!organizationSlug) {
    return { ok: false, message: "Indica el identificador de la organización." };
  }

  const phone = input.phone.replace(/\D/g, "");
  if (phone.length < 10 || phone.length > 15) {
    return {
      ok: false,
      message: "Usa el teléfono con código de país, solo números. Ej. 58412…",
    };
  }

  const payload: CreateSessionInput = {
    organizationSlug,
    phone,
    name: input.name?.trim() || undefined,
  };

  try {
    const session = await apiClient.createSession(payload);
    return { ok: true, session };
  } catch (error) {
    if (error instanceof ApiError || error instanceof Error) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "No se pudo abrir la sesión." };
  }
};
