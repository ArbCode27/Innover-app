import {
  API_BASE_URL,
  APP_CHANNEL_SECRET,
  hasChannelSecret,
} from "@/lib/app-env";
import { mapApiConversation, mapRealtime } from "@/lib/map-api-message";
import {
  multipartResultToResponse,
  postMultipartFile,
} from "@/lib/multipart-upload";
import {
  clearBiometricSession,
  clearSession,
  loadAccessToken,
} from "@/lib/session-storage";
import {
  API_ERROR_CODES,
  NETWORK_NOTICE,
} from "@/lib/user-notice";
import type {
  ApiBillingResponse,
  ApiContractsResponse,
  ApiConversation,
  ApiErrorBody,
  ApiMeResponse,
  ApiPaymentInstructionsResponse,
  ApiPaymentsResponse,
  ApiRealtimePayload,
  AppChannelSession,
  GetMessagesResponse,
  GetTicketResponse,
  GetTicketsResponse,
  LoginWithCedulaApiInput,
  RefreshRealtimeResponse,
  RegisterDeviceInput,
  RegisterDeviceResponse,
  SendMediaInput,
  SendMessageResponse,
} from "@/types/app-channel";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor(
    message = "Tu sesión expiró. Inicia sesión de nuevo.",
    code?: string,
  ) {
    super(message, 401, code);
    this.name = "UnauthorizedError";
  }
}

export class NetworkError extends ApiError {
  /**
   * Mensaje del fallo nativo de `fetch` (si existe).
   * El `message` de usuario sigue siendo genérico; features pueden
   * enriquecer el copy con `causeMessage` (p. ej. transcripción).
   */
  constructor(readonly causeMessage?: string) {
    super(NETWORK_NOTICE.description, 0, API_ERROR_CODES.NETWORK);
    this.name = "NetworkError";
  }
}

type UnauthorizedListener = () => void;

let unauthorizedListener: UnauthorizedListener | null = null;

export const setUnauthorizedListener = (
  listener: UnauthorizedListener | null,
) => {
  unauthorizedListener = listener;
};

const notifyUnauthorized = () => {
  unauthorizedListener?.();
};

const LOGIN_NO_LOGOUT_CODES: ReadonlySet<string> = new Set([
  API_ERROR_CODES.WRONG_PASSWORD,
  API_ERROR_CODES.INVALID_SECRET,
]);

const fallbackMessageForStatus = (status: number) => {
  if (status === 400) {
    return "Revisa los datos e inténtalo de nuevo.";
  }
  if (status === 401) {
    return "No pudimos validar tu acceso. Inténtalo de nuevo.";
  }
  if (status === 403) {
    return "Tu acceso a la app no está activo. Comunícate con Innover.";
  }
  if (status === 404) {
    return "No encontramos esa cédula en Conexiones Innover.";
  }
  if (status === 413) {
    return "El archivo es demasiado grande. Inténtalo con uno más liviano.";
  }
  if (status === 503) {
    return "Ese servicio no está disponible ahora. Inténtalo más tarde.";
  }
  return "No se pudo completar la solicitud. Inténtalo de nuevo.";
};

export const readApiErrorBody = async (
  res: Response,
  fallback: string,
): Promise<{ error: string; code?: string }> => {
  const data = (await res.json().catch(() => ({}))) as Partial<ApiErrorBody> & {
    message?: string;
  };
  const error =
    (typeof data.error === "string" && data.error.trim()) ||
    fallback;
  const code =
    typeof data.code === "string" && data.code.trim()
      ? data.code.trim()
      : undefined;
  return { error, code };
};

export const readApiError = async (res: Response, fallback: string) => {
  const { error } = await readApiErrorBody(res, fallback);
  return error;
};

const expireSession = async () => {
  await clearSession();
  await clearBiometricSession();
  notifyUnauthorized();
};

const shouldExpireSession = (
  status: number,
  code: string | undefined,
  expireOnUnauthorized: boolean,
) => {
  if (code && LOGIN_NO_LOGOUT_CODES.has(code)) {
    return false;
  }
  if (code === API_ERROR_CODES.SESSION_EXPIRED) {
    return true;
  }
  return status === 401 && expireOnUnauthorized;
};

const handleResponse = async <T>(
  response: Response,
  options?: { expireOnUnauthorized?: boolean },
): Promise<T> => {
  if (!response.ok) {
    const parsed = await readApiErrorBody(
      response,
      fallbackMessageForStatus(response.status),
    );
    if (
      shouldExpireSession(
        response.status,
        parsed.code,
        options?.expireOnUnauthorized !== false,
      )
    ) {
      await expireSession();
    }
    if (response.status === 401) {
      throw new UnauthorizedError(parsed.error, parsed.code);
    }
    throw new ApiError(parsed.error, response.status, parsed.code);
  }
  return (await response.json()) as T;
};

const nativeFetchMessage = (error: unknown): string | undefined => {
  if (error instanceof Error) {
    const message = error.message.trim();
    return message.length > 0 ? message : undefined;
  }
  if (typeof error === "string") {
    const message = error.trim();
    return message.length > 0 ? message : undefined;
  }
  return undefined;
};

const request = async (url: string, init?: RequestInit) => {
  try {
    return await fetch(url, init);
  } catch (error) {
    const causeMessage = nativeFetchMessage(error);
    if (__DEV__) {
      console.warn("[api] network", { url, causeMessage, error });
    }
    throw new NetworkError(causeMessage);
  }
};

const authorizedHeaders = async (): Promise<Record<string, string>> => {
  const token = await loadAccessToken();
  if (!token) {
    await expireSession();
    throw new UnauthorizedError();
  }
  return { Authorization: `Bearer ${token}` };
};

type SessionApiResponse = {
  token: string;
  role?: "customer" | "technician" | "supervisor";
  organization: { id: string; name: string; slug: string };
  client: {
    id: number;
    name: string;
    phone: string | null;
    cedula?: string | null;
    app_enabled?: boolean;
    zone?: string | null;
    wispro_linked?: boolean;
    wispro_id?: string | null;
    account?: string | null;
    plan?: string | null;
    debt?: number | null;
    has_debt?: boolean;
    service_suspended?: boolean;
    contract_state?: string | null;
    contract_state_label?: string | null;
    contract_id?: string | null;
    plan_name?: string | null;
    ppp_profile?: string | null;
    calculated_at?: string | null;
  } | null;
  technician?: {
    id: string;
    name: string;
    phone: string | null;
    document: string | null;
    is_supervisor: boolean;
    app_enabled: boolean;
  } | null;
  conversation: ApiConversation | null;
  realtime?: ApiRealtimePayload | null;
};

const toSession = (payload: SessionApiResponse): AppChannelSession => {
  const role =
    payload.role ||
    (payload.technician ? "technician" : "customer");

  return {
    token: payload.token,
    role,
    organization: payload.organization,
    client: payload.client
      ? {
          id: payload.client.id,
          name: payload.client.name,
          phone: payload.client.phone,
          cedula: payload.client.cedula ?? undefined,
          appEnabled: payload.client.app_enabled,
          zone: payload.client.zone ?? null,
          wisproLinked: Boolean(payload.client.wispro_linked),
          wisproId: payload.client.wispro_id ?? null,
          account: payload.client
            .account as NonNullable<AppChannelSession["client"]>["account"],
          plan: payload.client.plan ?? null,
          debt: payload.client.debt ?? null,
          hasDebt: Boolean(payload.client.has_debt),
          serviceSuspended: Boolean(payload.client.service_suspended),
          contractState: payload.client.contract_state ?? null,
          contractStateLabel: payload.client.contract_state_label ?? null,
          contractId: payload.client.contract_id ?? null,
          planName: payload.client.plan_name ?? null,
          pppProfile: payload.client.ppp_profile ?? null,
          calculatedAt: payload.client.calculated_at ?? null,
        }
      : null,
    technician: payload.technician
      ? {
          id: payload.technician.id,
          name: payload.technician.name,
          phone: payload.technician.phone,
          document: payload.technician.document,
          isSupervisor: Boolean(payload.technician.is_supervisor),
          appEnabled: payload.technician.app_enabled !== false,
        }
      : null,
    conversation: payload.conversation
      ? mapApiConversation(payload.conversation)
      : null,
    realtime: mapRealtime(payload.realtime),
  };
};

const requestMultipart = async (
  input: Parameters<typeof postMultipartFile>[0],
) => {
  try {
    return await postMultipartFile(input);
  } catch (error) {
    const causeMessage = nativeFetchMessage(error);
    if (__DEV__) {
      console.warn("[api] multipart", {
        url: input.url,
        causeMessage,
        error,
      });
    }
    throw new NetworkError(causeMessage);
  }
};

export class ApiClient {
  loginWithCedula = async (input: LoginWithCedulaApiInput) => {
    if (!hasChannelSecret()) {
      throw new ApiError(
        __DEV__
          ? "La app no está configurada. Reinicia Expo desde apps/mobile."
          : "No pudimos entrar. Inténtalo más tarde o comunícate con Star Conectados.",
        401,
        API_ERROR_CODES.APP_SECRET_MISSING,
      );
    }

    const response = await request(`${API_BASE_URL}/api/app/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-app-secret": APP_CHANNEL_SECRET,
      },
      body: JSON.stringify({
        action: "login",
        cedula: input.cedula,
        password: input.password,
      }),
    });

    const payload = await handleResponse<SessionApiResponse>(response, {
      expireOnUnauthorized: false,
    });
    return toSession(payload);
  };

  refreshRealtime = async (): Promise<RefreshRealtimeResponse> => {
    const headers = await authorizedHeaders();
    const response = await request(`${API_BASE_URL}/api/app/realtime-token`, {
      method: "GET",
      headers,
    });
    return handleResponse<RefreshRealtimeResponse>(response);
  };

  getMessages = async (afterId?: number): Promise<GetMessagesResponse> => {
    const headers = await authorizedHeaders();
    const query =
      afterId != null && afterId > 0
        ? `?after_id=${encodeURIComponent(String(afterId))}`
        : "";
    const response = await request(`${API_BASE_URL}/api/app/messages${query}`, {
      method: "GET",
      headers,
    });
    return handleResponse<GetMessagesResponse>(response);
  };

  sendText = async (content: string): Promise<SendMessageResponse> => {
    const headers = await authorizedHeaders();
    const response = await request(`${API_BASE_URL}/api/app/messages`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });
    return handleResponse<SendMessageResponse>(response);
  };

  sendMedia = async (input: SendMediaInput): Promise<SendMessageResponse> => {
    const headers = await authorizedHeaders();
    const fields: Record<string, string> = {
      media_type: input.mediaType,
    };
    const caption = input.caption?.trim();
    if (caption) {
      fields.caption = caption;
    }

    const upload = await requestMultipart({
      url: `${API_BASE_URL}/api/app/messages`,
      headers,
      uri: input.uri,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fieldName: "file",
      fields,
    });
    return handleResponse<SendMessageResponse>(
      multipartResultToResponse(upload),
    );
  };

  getTickets = async (status?: string): Promise<GetTicketsResponse> => {
    const headers = await authorizedHeaders();
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    const response = await request(`${API_BASE_URL}/api/app/tickets${query}`, {
      method: "GET",
      headers,
    });
    return handleResponse<GetTicketsResponse>(response);
  };

  getTicket = async (ticketId: string): Promise<GetTicketResponse> => {
    const headers = await authorizedHeaders();
    const response = await request(
      `${API_BASE_URL}/api/app/tickets/${encodeURIComponent(ticketId)}`,
      {
        method: "GET",
        headers,
      },
    );
    return handleResponse<GetTicketResponse>(response);
  };

  registerDevice = async (
    input: RegisterDeviceInput,
  ): Promise<RegisterDeviceResponse> => {
    const headers = await authorizedHeaders();
    const response = await request(`${API_BASE_URL}/api/app/devices`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        push_token: input.pushToken,
        platform: input.platform,
      }),
    });
    return handleResponse<RegisterDeviceResponse>(response);
  };

  getMe = async (options?: { refresh?: boolean }): Promise<ApiMeResponse> => {
    const headers = await authorizedHeaders();
    const query = options?.refresh ? "?refresh=1" : "";
    const response = await request(`${API_BASE_URL}/api/app/me${query}`, {
      method: "GET",
      headers,
    });
    return handleResponse<ApiMeResponse>(response);
  };

  getBilling = async (options?: {
    refresh?: boolean;
  }): Promise<ApiBillingResponse> => {
    const headers = await authorizedHeaders();
    const query = options?.refresh ? "?refresh=1" : "";
    const response = await request(`${API_BASE_URL}/api/app/billing${query}`, {
      method: "GET",
      headers,
    });
    return handleResponse<ApiBillingResponse>(response);
  };

  getContracts = async (): Promise<ApiContractsResponse> => {
    const headers = await authorizedHeaders();
    const response = await request(`${API_BASE_URL}/api/app/contracts`, {
      method: "GET",
      headers,
    });
    return handleResponse<ApiContractsResponse>(response);
  };

  getPayments = async (): Promise<ApiPaymentsResponse> => {
    const headers = await authorizedHeaders();
    const response = await request(`${API_BASE_URL}/api/app/payments`, {
      method: "GET",
      headers,
    });
    return handleResponse<ApiPaymentsResponse>(response);
  };

  getPaymentInstructions = async (options?: {
    method?: string;
  }): Promise<ApiPaymentInstructionsResponse> => {
    const headers = await authorizedHeaders();
    const query =
      options?.method && options.method.trim()
        ? `?method=${encodeURIComponent(options.method.trim())}`
        : "";
    const response = await request(
      `${API_BASE_URL}/api/app/payment-instructions${query}`,
      {
        method: "GET",
        headers,
      },
    );
    return handleResponse<ApiPaymentInstructionsResponse>(response);
  };

  getTechnicianTickets = async (options?: {
    includeDone?: boolean;
  }): Promise<{ tickets: Record<string, unknown>[] }> => {
    const headers = await authorizedHeaders();
    const query = options?.includeDone ? "?include_done=1" : "";
    const response = await request(
      `${API_BASE_URL}/api/app/technician/tickets${query}`,
      { method: "GET", headers },
    );
    return handleResponse(response);
  };

  getTechnicianTicket = async (
    id: string,
  ): Promise<{ ticket: Record<string, unknown> }> => {
    const headers = await authorizedHeaders();
    const response = await request(
      `${API_BASE_URL}/api/app/technician/tickets/${encodeURIComponent(id)}`,
      { method: "GET", headers },
    );
    return handleResponse(response);
  };

  closeTechnicianTicket = async (
    id: string,
    observation: string,
  ): Promise<{ ticket: Record<string, unknown> }> => {
    const headers = await authorizedHeaders();
    const response = await request(
      `${API_BASE_URL}/api/app/technician/tickets/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "close", observation }),
      },
    );
    return handleResponse(response);
  };

  /**
   * Transcribe audio de cierre de visita (STT en servidor).
   * POST /api/app/technician/transcribe — multipart campo `file`, JWT app.
   * No cierra el ticket; solo devuelve `{ text }` para rellenar la observación.
   */
  transcribeTechnicianObservation = async (input: {
    uri: string;
    mimeType: string;
    fileName: string;
  }): Promise<{ text: string }> => {
    const headers = await authorizedHeaders();
    const upload = await requestMultipart({
      url: `${API_BASE_URL}/api/app/technician/transcribe`,
      headers,
      uri: input.uri,
      fileName: input.fileName || "recording.m4a",
      mimeType: input.mimeType || "audio/m4a",
      fieldName: "file",
    });
    return handleResponse<{ text: string }>(
      multipartResultToResponse(upload),
    );
  };

  getTechnicianMessages = async (
    afterId?: number,
  ): Promise<GetMessagesResponse> => {
    const headers = await authorizedHeaders();
    const query =
      afterId != null && afterId > 0
        ? `?after_id=${encodeURIComponent(String(afterId))}`
        : "";
    const response = await request(
      `${API_BASE_URL}/api/app/technician/messages${query}`,
      { method: "GET", headers },
    );
    return handleResponse<GetMessagesResponse>(response);
  };

  sendTechnicianText = async (
    content: string,
  ): Promise<SendMessageResponse> => {
    const headers = await authorizedHeaders();
    const response = await request(
      `${API_BASE_URL}/api/app/technician/messages`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      },
    );
    return handleResponse<SendMessageResponse>(response);
  };

  getSupervisorTechnicians = async (): Promise<{
    technicians: Array<{
      id: string;
      name: string;
      phone: string | null;
      document: string | null;
      is_supervisor: boolean;
    }>;
  }> => {
    const headers = await authorizedHeaders();
    const response = await request(
      `${API_BASE_URL}/api/app/supervisor/technicians`,
      { method: "GET", headers },
    );
    return handleResponse(response);
  };

  getSupervisorTickets = async (options?: {
    status?: string;
    technicianId?: string;
  }): Promise<{ tickets: Record<string, unknown>[]; total: number }> => {
    const headers = await authorizedHeaders();
    const params = new URLSearchParams();
    if (options?.status) params.set("status", options.status);
    if (options?.technicianId) {
      params.set("technician_id", options.technicianId);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await request(
      `${API_BASE_URL}/api/app/supervisor/tickets${query}`,
      { method: "GET", headers },
    );
    return handleResponse(response);
  };

  getSupervisorMetrics = async (
    range: "today" | "7d" | "30d" = "7d",
  ): Promise<{
    range: string;
    metrics: Array<{
      technician_id: string;
      name: string;
      assigned: number;
      pending: number;
      closed: number;
      close_rate_pct: number;
      avg_close_hours: number | null;
    }>;
  }> => {
    const headers = await authorizedHeaders();
    const response = await request(
      `${API_BASE_URL}/api/app/supervisor/metrics?range=${encodeURIComponent(range)}`,
      { method: "GET", headers },
    );
    return handleResponse(response);
  };
}

export const apiClient = new ApiClient();
