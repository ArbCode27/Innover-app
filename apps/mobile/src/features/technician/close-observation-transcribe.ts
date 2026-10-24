import { apiClient, ApiError, NetworkError } from "@/lib/api-client";
import {
  looksTechnicalErrorMessage,
  toUserFacingMessage,
} from "@/lib/user-facing-error";
import type { AppProfile } from "@/types/domain";
import * as FileSystem from "expo-file-system/legacy";

export type CloseObservationAudio = {
  uri: string;
  mimeType: string;
};

/** Límite del PATCH de cierre y del campo observación. */
export const CLOSE_OBSERVATION_MAX_CHARS = 2000;

/** Límite aproximado del POST /api/app/technician/transcribe. */
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;

const isMockProfile = (profile: AppProfile | null) =>
  Boolean(profile?.userId.startsWith("mock-"));

const assertAudioWithinLimit = async (uri: string) => {
  let info: FileSystem.FileInfo;
  try {
    info = await FileSystem.getInfoAsync(uri);
  } catch {
    // Si no se puede leer el tamaño, el servidor valida.
    return;
  }
  if (!info.exists) {
    throw new Error("No se encontró el audio grabado. Inténtalo de nuevo.");
  }
  if (
    "size" in info &&
    typeof info.size === "number" &&
    info.size > MAX_AUDIO_BYTES
  ) {
    throw new Error(
      "El audio es demasiado largo (máx. ~12 MB). Graba una nota más corta.",
    );
  }
};

/**
 * Mensajes descriptivos para el técnico (sin Intent/HTTP/JSON en UI).
 * El detalle técnico se registra en `__DEV__`.
 */
const mapTranscribeError = (error: unknown): Error => {
  if (__DEV__) {
    console.warn("[transcribe] raw", error);
  }

  if (error instanceof NetworkError) {
    return new Error(
      "No se pudo enviar el audio. Revisa la conexión e inténtalo de nuevo.",
    );
  }

  if (error instanceof ApiError) {
    if (error.status === 413) {
      return new Error(
        "El audio es demasiado largo. Graba una nota más corta.",
      );
    }
    if (error.status === 401) {
      return new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
    }
    if (error.status === 404 || error.status === 501 || error.status === 503) {
      return new Error(
        "La transcripción no está disponible ahora. Escribe la observación a mano.",
      );
    }
    const serverMessage = error.message.trim();
    if (serverMessage && !looksTechnicalErrorMessage(serverMessage)) {
      return new Error(serverMessage);
    }
    return new Error(
      "No se pudo transcribir el audio. Graba de nuevo o escribe la observación.",
    );
  }

  return new Error(
    toUserFacingMessage(
      error,
      "No se pudo transcribir el audio. Inténtalo de nuevo.",
    ),
  );
};

/**
 * Transcribe el audio de cierre de visita a texto (observación).
 * No cierra el ticket: solo rellena el campo para que el técnico lo revise.
 *
 * Backend: `POST /api/app/technician/transcribe` (multipart `file`, JWT app)
 * → `{ text }`. Mock solo para perfiles `mock-*`.
 */
export const transcribeCloseObservation = async (
  profile: AppProfile | null,
  audio: CloseObservationAudio,
): Promise<string> => {
  if (!profile || profile.role !== "technician") {
    throw new Error("Solo un técnico puede dictar la observación de cierre.");
  }

  if (isMockProfile(profile)) {
    await new Promise((resolve) => setTimeout(resolve, 900));
    return (
      "Se revisó el enlace en el domicilio del cliente. Se limpió el conector " +
      "de la NAP, se verificó potencia óptica y el servicio quedó operativo. " +
      "Cliente confirmó navegación en el sitio."
    );
  }

  await assertAudioWithinLimit(audio.uri);

  try {
    const payload = await apiClient.transcribeTechnicianObservation({
      uri: audio.uri,
      mimeType: audio.mimeType || "audio/m4a",
      fileName: "recording.m4a",
    });
    const text = payload.text?.trim() ?? "";
    if (text.length < 3) {
      throw new Error(
        "La transcripción quedó muy corta. Graba de nuevo o escribe la observación.",
      );
    }
    if (text.length > CLOSE_OBSERVATION_MAX_CHARS) {
      return text.slice(0, CLOSE_OBSERVATION_MAX_CHARS);
    }
    return text;
  } catch (error) {
    const mapped = mapTranscribeError(error);
    if (__DEV__) {
      console.warn("[transcribe]", {
        uri: audio.uri,
        mimeType: audio.mimeType,
        error,
        mapped: mapped.message,
      });
    }
    throw mapped;
  }
};
