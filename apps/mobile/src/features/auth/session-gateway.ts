import { ApiError, apiClient, UnauthorizedError } from "@/lib/api-client";
import { mapApiConversation, mapRealtime } from "@/lib/map-api-message";
import { noticeFromUnknown, type UserNotice } from "@/lib/user-notice";
import type { AppChannelSession } from "@/types/app-channel";

export type LoginWithCedulaInput = {
  cedula: string;
  password: string;
};

export type LoginWithCedulaResult =
  | { ok: true; session: AppChannelSession }
  | { ok: false; notice: UserNotice };

const normalizeCedula = (cedula: string) => cedula.replace(/\D/g, "");

const LOGIN_TITLE = "No pudimos entrar";

export const REALTIME_REFRESH_MARGIN_MS = 10 * 60 * 1000;
const MIN_REFRESH_DELAY_MS = 15_000;

export const realtimeNeedsRefresh = (expiresAt: number) =>
  expiresAt - Date.now() < REALTIME_REFRESH_MARGIN_MS;

export const msUntilRealtimeRefresh = (expiresAt: number) =>
  Math.max(
    expiresAt - Date.now() - REALTIME_REFRESH_MARGIN_MS,
    MIN_REFRESH_DELAY_MS,
  );

export const hydrateRealtime = async (
  session: AppChannelSession,
): Promise<AppChannelSession> => {
  try {
    const payload = await apiClient.refreshRealtime();
    return {
      ...session,
      conversation: payload.conversation
        ? mapApiConversation(payload.conversation)
        : session.conversation,
      realtime: mapRealtime(payload.realtime),
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    if (error instanceof ApiError && error.status === 503) {
      return { ...session, realtime: null };
    }
    return { ...session, realtime: session.realtime ?? null };
  }
};

export const loginWithCedulaAndPassword = async (
  input: LoginWithCedulaInput,
): Promise<LoginWithCedulaResult> => {
  const cedulaDigits = normalizeCedula(input.cedula);
  if (!cedulaDigits) {
    return {
      ok: false,
      notice: {
        title: LOGIN_TITLE,
        description: "Escribe tu cédula.",
        code: "CEDULA_REQUIRED",
      },
    };
  }

  const password = input.password.trim();
  if (!password) {
    return {
      ok: false,
      notice: {
        title: LOGIN_TITLE,
        description: "Escribe tu contraseña.",
        code: "PASSWORD_REQUIRED",
      },
    };
  }

  try {
    const session = await apiClient.loginWithCedula({
      cedula: cedulaDigits,
      password,
    });
    return { ok: true, session };
  } catch (error) {
    return {
      ok: false,
      notice: noticeFromUnknown(error, LOGIN_TITLE),
    };
  }
};
