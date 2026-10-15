import {
  API_BASE_URL,
  APP_CHANNEL_SECRET,
  hasChannelSecret,
} from "@/lib/app-env";
import { clearSession, loadAccessToken } from "@/lib/session-storage";
import type {
  ApiConversation,
  CreateSessionInput,
  GetMessagesResponse,
  RegisterDeviceInput,
  RegisterDeviceResponse,
  SendMediaInput,
  SendMessageResponse,
} from "@/types/app-channel";

export class UnauthorizedError extends Error {
  readonly status = 401;

  constructor(message = "La sesión expiró. Vuelve a entrar.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type UnauthorizedListener = () => void;

let unauthorizedListener: UnauthorizedListener | null = null;

export const setUnauthorizedListener = (listener: UnauthorizedListener | null) => {
  unauthorizedListener = listener;
};

const notifyUnauthorized = () => {
  unauthorizedListener?.();
};

const messageForStatus = (status: number) => {
  if (status === 400) {
    return "Revisa los datos e inténtalo de nuevo.";
  }
  if (status === 401) {
    return "No autorizado. Revisa el canal o vuelve a entrar.";
  }
  if (status === 404) {
    return "No encontramos esa organización.";
  }
  if (status === 503) {
    return "El registro de dispositivos aún no está disponible.";
  }
  return "No se pudo completar la solicitud.";
};

const readErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as { message?: string; error?: string };
    return payload.message || payload.error || messageForStatus(response.status);
  } catch {
    return messageForStatus(response.status);
  }
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 401) {
    await clearSession();
    notifyUnauthorized();
    throw new UnauthorizedError(await readErrorMessage(response));
  }
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  return (await response.json()) as T;
};

const authorizedHeaders = async (): Promise<Record<string, string>> => {
  const token = await loadAccessToken();
  if (!token) {
    notifyUnauthorized();
    throw new UnauthorizedError();
  }
  return { Authorization: `Bearer ${token}` };
};

type SessionApiResponse = {
  token: string;
  organization: { id: string; name: string; slug: string };
  client: { id: number; name: string; phone: string };
  conversation: ApiConversation;
};

const toSession = (payload: SessionApiResponse) => ({
  token: payload.token,
  organization: payload.organization,
  client: payload.client,
  conversation: {
    id: payload.conversation.id,
    status: payload.conversation.status,
    humanMode: Boolean(payload.conversation.human_mode),
  },
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
  createSession = async (input: CreateSessionInput) => {
    if (!hasChannelSecret()) {
      throw new ApiError(
        "Falta el secreto de canal en el entorno de la app.",
        401,
      );
    }

    const phone = input.phone.replace(/\D/g, "");
    const name = input.name?.trim();
    const response = await fetch(`${API_BASE_URL}/api/app/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-app-secret": APP_CHANNEL_SECRET,
      },
      body: JSON.stringify({
        organization_slug: input.organizationSlug.trim(),
        phone,
        ...(name ? { name: name.slice(0, 80) } : {}),
      }),
    });

    const payload = await handleResponse<SessionApiResponse>(response);
    return toSession(payload);
  };

  getMessages = async (): Promise<GetMessagesResponse> => {
    const headers = await authorizedHeaders();
    const response = await fetch(`${API_BASE_URL}/api/app/messages`, {
      method: "GET",
      headers,
    });
    return handleResponse<GetMessagesResponse>(response);
  };

  sendText = async (content: string): Promise<SendMessageResponse> => {
    const headers = await authorizedHeaders();
    const response = await fetch(`${API_BASE_URL}/api/app/messages`, {
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
    if (input.content?.trim()) {
      form.append("content", input.content.trim());
    }

    const response = await fetch(`${API_BASE_URL}/api/app/messages`, {
      method: "POST",
      headers,
      body: form,
    });
    return handleResponse<SendMessageResponse>(response);
  };

  registerDevice = async (
    input: RegisterDeviceInput,
  ): Promise<RegisterDeviceResponse> => {
    const headers = await authorizedHeaders();
    const response = await fetch(`${API_BASE_URL}/api/app/devices`, {
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
}

export const apiClient = new ApiClient();
