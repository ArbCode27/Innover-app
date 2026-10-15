import type { MessageMediaType, MessageSenderType } from "@/types/domain";

export type AppConversationStatus = "abierto" | "proceso" | "resuelto";

export type AppChannelOrganization = {
  id: string;
  name: string;
  slug: string;
};

export type AppChannelClient = {
  id: number;
  name: string;
  phone: string;
  cedula?: string;
};

export type AppChannelConversation = {
  id: number;
  status: AppConversationStatus | string;
  humanMode: boolean;
};

export type AppChannelSession = {
  token: string;
  organization: AppChannelOrganization;
  client: AppChannelClient;
  conversation: AppChannelConversation;
};

export type CreateSessionInput = {
  organizationSlug: string;
  phone: string;
  name?: string;
};

export type ApiMessageType = "in" | "out";

export type ApiMessage = {
  id: number;
  conversation_id: number;
  type: ApiMessageType;
  content: string;
  sender_type: MessageSenderType;
  sent_by: string | null;
  status: string;
  created_at: string;
  media_url: string | null;
  media_type: MessageMediaType | null;
  mime_type: string | null;
  caption: string | null;
  metadata: Record<string, unknown> | null;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  location_address: string | null;
};

export type ApiConversation = {
  id: number;
  status: string;
  human_mode: boolean;
};

export type GetMessagesResponse = {
  conversation: ApiConversation;
  messages: ApiMessage[];
};

export type SendMessageResponse = {
  success: true;
  message: ApiMessage;
};

export type RegisterDeviceInput = {
  pushToken: string;
  platform: "android" | "ios" | "web";
};

export type RegisterDeviceResponse = {
  success: true;
  device: { id: string; platform: "android" | "ios" | "web" };
};

export type SendMediaInput = {
  uri: string;
  mediaType: Exclude<MessageMediaType, "location">;
  mimeType: string;
  fileName: string;
  caption?: string;
  content?: string;
};

export type ChatSnapshot = {
  conversation: AppChannelConversation;
  messages: import("@/types/domain").AppMessage[];
};
