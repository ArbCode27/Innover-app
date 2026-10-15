import { APP_ATTACHMENTS_BUCKET, hasSupabasePublicEnv } from "@/lib/supabase-env";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

export type AttachmentKind = "image" | "audio";

export type UploadedAttachment = {
  uri: string;
  storagePath: string | null;
  mimeType: string;
};

const extensionFor = (kind: AttachmentKind, mimeType: string) => {
  if (kind === "audio") {
    if (mimeType.includes("mp4")) return "m4a";
    if (mimeType.includes("mpeg")) return "mp3";
    return "m4a";
  }
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  return "jpg";
};

const base64ToUint8Array = (base64: string) => {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

const readUploadBody = async (uri: string) => {
  if (Platform.OS === "web") {
    const response = await fetch(uri);
    return response.blob();
  }
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return base64ToUint8Array(base64);
};

export const uploadAppAttachment = async (input: {
  uri: string;
  mimeType: string;
  kind: AttachmentKind;
  userId: string;
}): Promise<UploadedAttachment> => {
  if (!hasSupabasePublicEnv()) {
    return {
      uri: input.uri,
      storagePath: null,
      mimeType: input.mimeType,
    };
  }

  const ext = extensionFor(input.kind, input.mimeType);
  const storagePath = `${input.userId}/${Date.now()}.${ext}`;

  try {
    const body = await readUploadBody(input.uri);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.storage
      .from(APP_ATTACHMENTS_BUCKET)
      .upload(storagePath, body, {
        contentType: input.mimeType,
        upsert: false,
      });

    if (error) {
      return {
        uri: input.uri,
        storagePath: null,
        mimeType: input.mimeType,
      };
    }

    const { data } = supabase.storage
      .from(APP_ATTACHMENTS_BUCKET)
      .getPublicUrl(storagePath);

    return {
      uri: data.publicUrl || input.uri,
      storagePath,
      mimeType: input.mimeType,
    };
  } catch {
    return {
      uri: input.uri,
      storagePath: null,
      mimeType: input.mimeType,
    };
  }
};
