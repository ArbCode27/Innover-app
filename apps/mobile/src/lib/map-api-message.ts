import type {
  ApiConversation,
  ApiMessage,
  ApiRealtimePayload,
  AppRealtimeSession,
} from "@/types/app-channel";
import type { AppMessage, MessageSenderType } from "@/types/domain";

const isSenderType = (value: string): value is MessageSenderType =>
  value === "client" || value === "bot" || value === "agent";

const mapStatus = (value: string): AppMessage["status"] => {
  if (
    value === "failed" ||
    value === "pending" ||
    value === "delivered" ||
    value === "read"
  ) {
    return value;
  }
  return "sent";
};

export const mapApiConversation = (row: ApiConversation) => ({
  id: row.id,
  status: row.status,
  humanMode: Boolean(row.human_mode),
});

export const mapRealtime = (
  row: ApiRealtimePayload | null | undefined,
): AppRealtimeSession | null => {
  if (!row?.url || !row.anon_key || !row.access_token) {
    return null;
  }
  return {
    url: row.url,
    anonKey: row.anon_key,
    accessToken: row.access_token,
    expiresAt: row.expires_at,
    conversationId: row.conversation_id,
  };
};

export const mapApiMessage = (row: ApiMessage): AppMessage => ({
  id: row.id,
  conversationId: row.conversation_id,
  type: row.type === "out" ? "out" : "in",
  content: row.content ?? "",
  senderType: isSenderType(row.sender_type) ? row.sender_type : "client",
  sentBy: row.sent_by,
  status: mapStatus(row.status),
  createdAt: row.created_at,
  mediaType: row.media_type,
  mediaUrl: row.media_url,
  mimeType: row.mime_type,
  caption: row.caption,
  latitude: row.latitude,
  longitude: row.longitude,
  locationName: row.location_name ?? row.location_address,
  locationAddress: row.location_address,
});

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const asString = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

export const coerceApiMessage = (row: unknown): ApiMessage | null => {
  if (!row || typeof row !== "object") {
    return null;
  }
  const data = row as Record<string, unknown>;
  const id = asNumber(data.id);
  const conversationId = asNumber(data.conversation_id);
  const type = data.type;
  if (id == null || conversationId == null) {
    return null;
  }
  if (type !== "in" && type !== "out" && type !== "note") {
    return null;
  }
  const senderType = asString(data.sender_type) ?? "client";
  return {
    id,
    conversation_id: conversationId,
    type,
    content: asString(data.content) ?? "",
    sender_type: isSenderType(senderType) ? senderType : "client",
    sent_by: asString(data.sent_by),
    status: asString(data.status) ?? "sent",
    created_at: asString(data.created_at) ?? new Date().toISOString(),
    media_url: asString(data.media_url),
    media_type:
      data.media_type === "audio" ||
      data.media_type === "image" ||
      data.media_type === "video" ||
      data.media_type === "document" ||
      data.media_type === "location"
        ? data.media_type
        : null,
    mime_type: asString(data.mime_type),
    caption: asString(data.caption),
    metadata:
      data.metadata && typeof data.metadata === "object"
        ? (data.metadata as Record<string, unknown>)
        : null,
    latitude: asNumber(data.latitude),
    longitude: asNumber(data.longitude),
    location_name: asString(data.location_name),
    location_address: asString(data.location_address),
  };
};
