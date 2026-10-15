import {
  APP_CONVERSATION_ID,
  fetchConversationMessages,
  sendClientDraft as sendMockDraft,
  retryFailedDraft as retryMockDraft,
} from "@/features/chat/chat-gateway";
import type { ChatSnapshot, SendMediaInput } from "@/types/app-channel";
import type { AppMessage, OutboundClientDraft } from "@/types/domain";

export const fetchConversationSnapshot = async (): Promise<ChatSnapshot> => {
  const messages = await fetchConversationMessages();
  return {
    conversation: {
      id: APP_CONVERSATION_ID,
      status: "abierto",
      humanMode: false,
    },
    messages,
  };
};

export const sendClientText = async (content: string): Promise<AppMessage> => {
  const trimmed = content.trim();
  if (trimmed.length < 1 || trimmed.length > 4096) {
    throw new Error("El mensaje debe tener entre 1 y 4096 caracteres.");
  }
  return sendMockDraft({ content: trimmed });
};

export const sendClientMedia = async (
  input: SendMediaInput,
): Promise<AppMessage> => {
  return sendMockDraft({
    content: input.content || "",
    mediaUrl: input.uri,
    mediaType: input.mediaType,
    mimeType: input.mimeType,
    fileName: input.fileName,
    caption: input.caption,
  });
};

export const sendClientDraft = async (
  draft: OutboundClientDraft,
): Promise<AppMessage> => {
  if (draft.mediaUrl && draft.mediaType && draft.mediaType !== "location") {
    return sendClientMedia({
      uri: draft.mediaUrl,
      mediaType: draft.mediaType,
      mimeType: draft.mimeType ?? "application/octet-stream",
      fileName: draft.fileName ?? `adjunto-${Date.now()}`,
      caption: draft.caption ?? undefined,
      content: draft.content || undefined,
    });
  }
  return sendMockDraft(draft);
};

export const retryFailedDraft = async (draft: OutboundClientDraft) =>
  retryMockDraft(draft);
