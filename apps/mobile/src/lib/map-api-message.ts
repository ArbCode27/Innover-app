import type { ApiConversation, ApiMessage } from "@/types/app-channel";
import type { AppMessage, MessageSenderType } from "@/types/domain";

const isSenderType = (value: string): value is MessageSenderType =>
  value === "client" || value === "bot" || value === "agent";

const mapStatus = (value: string): AppMessage["status"] => {
  if (value === "failed" || value === "pending") {
    return value;
  }
  return "sent";
};

export const mapApiConversation = (row: ApiConversation) => ({
  id: row.id,
  status: row.status,
  humanMode: Boolean(row.human_mode),
});

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
});
