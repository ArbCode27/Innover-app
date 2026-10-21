export type UserNotice = {
  title: string;
  description: string;
  code?: string;
};

export const API_ERROR_CODES = {
  SESSION_EXPIRED: "SESSION_EXPIRED",
  NETWORK: "NETWORK",
  APP_SECRET_MISSING: "APP_SECRET_MISSING",
  WRONG_PASSWORD: "WRONG_PASSWORD",
  INVALID_SECRET: "INVALID_SECRET",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;

const TITLE_BY_CODE: Record<string, string> = {
  [API_ERROR_CODES.SESSION_EXPIRED]: "Tu sesión venció",
  [API_ERROR_CODES.NETWORK]: "Sin conexión",
  [API_ERROR_CODES.APP_SECRET_MISSING]: "No pudimos entrar",
  [API_ERROR_CODES.WRONG_PASSWORD]: "Contraseña incorrecta",
  [API_ERROR_CODES.INVALID_SECRET]: "No pudimos entrar",
};

export const NETWORK_NOTICE: UserNotice = {
  title: "Sin conexión",
  description: "Sin conexión",
  code: API_ERROR_CODES.NETWORK,
};

export const isNetworkFailure = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    error.name === "TypeError" ||
    message === "failed to fetch" ||
    message === "network request failed" ||
    message === "sin conexión" ||
    message.includes("network error") ||
    message.includes("network request failed")
  );
};

type NoticeSource = {
  message: string;
  code?: string;
};

export const titleForCode = (code: string | undefined, fallback: string) => {
  if (code && TITLE_BY_CODE[code]) {
    return TITLE_BY_CODE[code];
  }
  return fallback;
};

export const noticeFromSource = (
  source: NoticeSource,
  fallbackTitle: string,
): UserNotice => ({
  title: titleForCode(source.code, fallbackTitle),
  description: source.message,
  code: source.code,
});

export const noticeFromUnknown = (
  error: unknown,
  fallbackTitle: string,
): UserNotice => {
  if (error && typeof error === "object" && "message" in error) {
    const maybe = error as { message: string; code?: string; name?: string };
    if (maybe.name === "NetworkError" || maybe.code === API_ERROR_CODES.NETWORK) {
      return NETWORK_NOTICE;
    }
    if (typeof maybe.message === "string" && maybe.message.trim()) {
      if (isNetworkFailure(error)) {
        return NETWORK_NOTICE;
      }
      return noticeFromSource(
        { message: maybe.message.trim(), code: maybe.code },
        fallbackTitle,
      );
    }
  }
  if (isNetworkFailure(error)) {
    return NETWORK_NOTICE;
  }
  return {
    title: fallbackTitle,
    description: "Inténtalo de nuevo. Si sigue fallando, comunícate con Innover.",
  };
};
