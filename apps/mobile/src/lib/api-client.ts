import {
  API_BASE_URL,
  APP_CHANNEL_SECRET,
  hasChannelSecret,
} from "@/lib/app-env";
import { mapApiConversation, mapRealtime } from "@/lib/map-api-message";
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
  constructor() {
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

const request = async (url: string, init?: RequestInit) => {
  try {
    return await fetch(url, init);
  } catch (error) {
    if (__DEV__) {
      console.warn("[api] network", error);
    }
    throw new NetworkError();
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
  };
  conversation: ApiConversation;
  realtime?: ApiRealtimePayload | null;
};

const toSession = (payload: SessionApiResponse): AppChannelSession => ({
  token: payload.token,
  organization: payload.organization,
  client: {
    id: payload.client.id,
    name: payload.client.name,
    phone: payload.client.phone,
    cedula: payload.client.cedula ?? undefined,
    appEnabled: payload.client.app_enabled,
    zone: payload.client.zone ?? null,
    wisproLinked: Boolean(payload.client.wispro_linked),
    wisproId: payload.client.wispro_id ?? null,
    account: payload.client.account as AppChannelSession["client"]["account"],
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
  },
  conversation: mapApiConversation(payload.conversation),
  realtime: mapRealtime(payload.realtime),
});

const appendFile = (
  form: FormData,
  file: { uri: string; name: string; type: string },
) => {
  form.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);
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
    const form = new FormData();
    appendFile(form, {
      uri: input.uri,
      name: input.fileName,
      type: input.mimeType,
    });
    form.append("media_type", input.mediaType);
    if (input.caption?.trim()) {
      form.append("caption", input.caption.trim());
    }

    const response = await request(`${API_BASE_URL}/api/app/messages`, {
      method: "POST",
      headers,
      body: form,
    });
    return handleResponse<SendMessageResponse>(response);
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
}

export const apiClient = new ApiClient();
