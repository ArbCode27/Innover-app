/**
 * Convierte errores nativos / de red / de Intent en copy usable por el técnico
 * o el cliente. El detalle técnico queda solo en logs `__DEV__`.
 */

const TECHNICAL_PATTERN =
  /intent\s*\{|no activity found|could not open url|unsupported formdata|network request failed|\bHTTP\s+\d{3}\b|\bJSON\b|stack|TypeError|SyntaxError|status=\d|file:\/\/|content:\/\/|\[api\]|FormDataPart|AbortError/i;

export const looksTechnicalErrorMessage = (message: string): boolean => {
  const trimmed = message.trim();
  if (!trimmed) {
    return true;
  }
  if (trimmed.length > 160) {
    return true;
  }
  return TECHNICAL_PATTERN.test(trimmed);
};

export const toUserFacingMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (!(error instanceof Error)) {
    return fallback;
  }
  const message = error.message.trim();
  if (!message || looksTechnicalErrorMessage(message)) {
    if (__DEV__ && message) {
      console.warn("[user-facing]", message);
    }
    return fallback;
  }
  return message;
};
