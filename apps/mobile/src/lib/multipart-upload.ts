import { File, Paths, UploadType } from "expo-file-system";
import { fetch as expoFetch } from "expo/fetch";
import { Platform } from "react-native";

export type MultipartUploadInput = {
  url: string;
  /** Solo Authorization (u otros). No incluir Content-Type. */
  headers: Record<string, string>;
  uri: string;
  /** Nombre del campo multipart. Por defecto `file`. */
  fieldName?: string;
  /** Nombre en Content-Disposition (p. ej. recording.m4a). */
  fileName?: string;
  mimeType?: string;
  /** Campos de texto adicionales (media_type, caption, …). */
  fields?: Record<string, string>;
};

export type MultipartUploadResult = {
  status: number;
  bodyText: string;
};

const basenameFromUri = (uri: string) => {
  const cleaned = uri.split("?")[0] ?? uri;
  const parts = cleaned.split(/[/\\]/);
  return parts[parts.length - 1] || "upload.bin";
};

/**
 * Materializa un `File` de expo-file-system. Si se pide `fileName` distinto
 * al del path, copia a cache para fijar el nombre en el multipart.
 */
const materializeLocalFile = async (
  uri: string,
  fileName?: string,
): Promise<File> => {
  const source = new File(uri);
  if (!source.exists) {
    throw new Error("No se encontró el archivo local para subir.");
  }

  const desiredName = fileName?.trim();
  if (!desiredName || source.name === desiredName) {
    return source;
  }

  const destination = new File(Paths.cache, desiredName);
  if (destination.exists) {
    destination.delete();
  }
  await source.copy(destination, { overwrite: true });
  return destination;
};

const postMultipartWeb = async (
  input: MultipartUploadInput,
): Promise<MultipartUploadResult> => {
  const fileName = input.fileName?.trim() || basenameFromUri(input.uri);
  const blobResponse = await fetch(input.uri);
  const blob = await blobResponse.blob();
  const form = new FormData();
  form.append(input.fieldName ?? "file", blob, fileName);
  for (const [key, value] of Object.entries(input.fields ?? {})) {
    form.append(key, value);
  }

  const response = await expoFetch(input.url, {
    method: "POST",
    headers: input.headers,
    body: form,
  });
  const bodyText = await response.text();
  return { status: response.status, bodyText };
};

/**
 * Sube un archivo local como multipart/form-data (campo `file` por defecto).
 *
 * En native usa `File.upload` (MULTIPART) para evitar el error de Expo 58
 * `Unsupported FormDataPart implementation` del patrón RN `{ uri, name, type }`.
 */
export const postMultipartFile = async (
  input: MultipartUploadInput,
): Promise<MultipartUploadResult> => {
  if (Platform.OS === "web") {
    return postMultipartWeb(input);
  }

  const file = await materializeLocalFile(input.uri, input.fileName);
  const result = await file.upload(input.url, {
    uploadType: UploadType.MULTIPART,
    httpMethod: "POST",
    fieldName: input.fieldName ?? "file",
    mimeType: input.mimeType,
    headers: input.headers,
    parameters: input.fields,
  });

  return {
    status: result.status,
    bodyText: result.body,
  };
};

/** Adapta el resultado de upload al shape que usa `handleResponse`. */
export const multipartResultToResponse = (
  result: MultipartUploadResult,
): Response => {
  const status = result.status;
  const bodyText = result.bodyText;
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: "",
    url: "",
    redirected: false,
    type: "default",
    headers: new Headers(),
    body: null,
    bodyUsed: false,
    clone() {
      return multipartResultToResponse(result);
    },
    async json() {
      if (!bodyText.trim()) {
        return {};
      }
      return JSON.parse(bodyText) as unknown;
    },
    async text() {
      return bodyText;
    },
    async arrayBuffer() {
      return new TextEncoder().encode(bodyText).buffer;
    },
    async blob() {
      return new Blob([bodyText]);
    },
    async formData() {
      return new FormData();
    },
    async bytes() {
      return new TextEncoder().encode(bodyText);
    },
  } as Response;
};
