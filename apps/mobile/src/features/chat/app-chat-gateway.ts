import { apiClient } from "@/lib/api-client";
import { mapApiConversation, mapApiMessage } from "@/lib/map-api-message";
import { visibleMessageType } from "@/features/chat/chat-cache";
import type { ChatSnapshot, SendMediaInput } from "@/types/app-channel";
import type { AppMessage, OutboundClientDraft } from "@/types/domain";

export const fetchConversationSnapshot = async (
  afterId?: number,
): Promise<ChatSnapshot> => {
  const payload = await apiClient.getMessages(afterId);
  return {
    conversation: mapApiConversation(payload.conversation),
    messages: payload.messages
      .filter((message) => visibleMessageType(message.type))
      .map(mapApiMessage),
  };
};

export const sendClientText = async (content: string): Promise<AppMessage> => {
  const trimmed = content.trim();
  if (trimmed.length < 1 || trimmed.length > 4096) {
    throw new Error("El mensaje debe tener entre 1 y 4096 caracteres.");
  }
  const payload = await apiClient.sendText(trimmed);
  return mapApiMessage(payload.message);
};

export const sendClientMedia = async (
  input: SendMediaInput,
): Promise<AppMessage> => {
  const payload = await apiClient.sendMedia(input);
  return mapApiMessage(payload.message);
};

const locationContent = (draft: OutboundClientDraft) => {
  const label = draft.locationName?.trim() || draft.content.trim() || "Ubicación";
  if (draft.latitude != null && draft.longitude != null) {
    return `${label}: ${draft.latitude}, ${draft.longitude}`;
  }
  return label;
};

export const sendClientDraft = async (
  draft: OutboundClientDraft,
): Promise<AppMessage> => {
  if (draft.mediaType === "location") {
    return sendClientText(locationContent(draft));
  }
  if (draft.mediaUrl && draft.mediaType) {
    return sendClientMedia({
      uri: draft.mediaUrl,
      mediaType: draft.mediaType,
      mimeType: draft.mimeType ?? "application/octet-stream",
      fileName: draft.fileName ?? `adjunto-${Date.now()}`,
      caption: draft.caption ?? undefined,
    });
  }
  return sendClientText(draft.content);
};

export const retryFailedDraft = async (draft: OutboundClientDraft) =>
  sendClientDraft(draft);
