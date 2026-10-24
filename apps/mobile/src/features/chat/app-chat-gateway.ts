import { loadSession, saveSession } from "@/lib/session-storage";
import { apiClient } from "@/lib/api-client";
import {
  mapApiConversation,
  mapApiMessage,
  mapRealtime,
} from "@/lib/map-api-message";
import { visibleMessageType } from "@/features/chat/chat-cache";
import type {
  AppChannelSession,
  ChatSnapshot,
  GetMessagesResponse,
  SendMediaInput,
} from "@/types/app-channel";
import type { AppMessage, OutboundClientDraft } from "@/types/domain";

const isFieldRole = (session: AppChannelSession | null) =>
  session?.role === "technician" || session?.role === "supervisor";

/** Persiste conversation (+ realtime si viene) tras el primer GET de campo. */
export const mergeFieldChatIntoSession = async (
  payload: GetMessagesResponse,
): Promise<AppChannelSession | null> => {
  const session = await loadSession();
  if (!session || !isFieldRole(session)) {
    return session;
  }

  const conversation = mapApiConversation(payload.conversation);
  const realtime = mapRealtime(payload.realtime) ?? session.realtime;
  const next: AppChannelSession = {
    ...session,
    conversation,
    realtime,
  };

  const sameConversation =
    session.conversation?.id === next.conversation?.id &&
    session.conversation?.humanMode === next.conversation?.humanMode &&
    session.conversation?.status === next.conversation?.status;
  const sameRealtime =
    session.realtime?.accessToken === next.realtime?.accessToken &&
    session.realtime?.expiresAt === next.realtime?.expiresAt &&
    session.realtime?.conversationId === next.realtime?.conversationId;

  if (sameConversation && sameRealtime) {
    return session;
  }

  await saveSession(next);
  return next;
};

export const fetchConversationSnapshot = async (
  afterId?: number,
): Promise<ChatSnapshot> => {
  const session = await loadSession();
  const field = isFieldRole(session);
  const payload = field
    ? await apiClient.getTechnicianMessages(afterId)
    : await apiClient.getMessages(afterId);

  if (field) {
    await mergeFieldChatIntoSession(payload);
  }

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
  const session = await loadSession();
  const field = isFieldRole(session);
  const payload = field
    ? await apiClient.sendTechnicianText(trimmed)
    : await apiClient.sendText(trimmed);
  return mapApiMessage(payload.message);
};

export const sendClientMedia = async (
  input: SendMediaInput,
): Promise<AppMessage> => {
  if (isFieldRole(await loadSession())) {
    throw new Error(
      "Por ahora el chat de campo solo admite texto. Envía el adjunto por otro canal o contacta a oficina.",
    );
  }
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
  if (isFieldRole(await loadSession())) {
    if (draft.mediaType || draft.mediaUrl) {
      throw new Error(
        "Por ahora el chat de campo solo admite texto. Envía el adjunto por otro canal o contacta a oficina.",
      );
    }
    return sendClientText(draft.content);
  }

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
