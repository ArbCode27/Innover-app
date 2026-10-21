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
  appEnabled?: boolean;
};

export type AppChannelConversation = {
  id: number;
  status: AppConversationStatus | string;
  humanMode: boolean;
};

/** JWT de Supabase Realtime (~1 h). Distinto del Bearer HMAC de 30 días. */
export type AppRealtimeSession = {
  url: string;
  anonKey: string;
  accessToken: string;
  expiresAt: number;
  conversationId: number;
};

export type AppChannelSession = {
  token: string;
  organization: AppChannelOrganization;
  client: AppChannelClient;
  conversation: AppChannelConversation;
  realtime: AppRealtimeSession | null;
};

export type CreateSessionInput = {
  organizationSlug: string;
  phone: string;
  name?: string;
};

export type LoginWithCedulaApiInput = {
  cedula: string;
  password: string;
};

/** Cuerpo de error de `/api/app/*`. `error` es copy de usuario; `code` es la causa. */
export type ApiErrorBody = {
  error: string;
  code: string;
};

export type ApiErrorCode =
  | "CEDULA_REQUIRED"
  | "PASSWORD_REQUIRED"
  | "CEDULA_INVALID"
  | "CLIENT_NOT_FOUND"
  | "WRONG_PASSWORD"
  | "APP_DISABLED"
  | "ORGANIZATION_INACTIVE"
  | "SESSION_EXPIRED"
  | "INVALID_SECRET"
  | "INVALID_JSON"
  | "VALIDATION_ERROR"
  | "MESSAGE_EMPTY"
  | "MESSAGE_TOO_LONG"
  | "MEDIA_UPLOAD_FAILED"
  | "MESSAGE_SEND_FAILED"
  | "MESSAGE_LOAD_FAILED"
  | "TICKET_NOT_FOUND"
  | "TICKETS_LOAD_FAILED"
  | "DEVICE_REGISTER_FAILED"
  | "SERVICE_UNAVAILABLE"
  | "DUPLICATE_CLIENT"
  | "SESSION_FAILED";

export type ApiRealtimePayload = {
  url: string;
  anon_key: string;
  access_token: string;
  expires_at: number;
  conversation_id: number;
};

export type ApiMessageType = "in" | "out" | "note";

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

export type RefreshRealtimeResponse = {
  realtime: ApiRealtimePayload | null;
  conversation: ApiConversation;
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

export type ApiTicketTechnician = {
  name: string | null;
  phone: string | null;
};

export type ApiTicket = {
  id: string;
  public_id: number | null;
  status: import("@/types/domain").CasoStatus | string;
  status_label?: string;
  priority: import("@/types/domain").CasoPriority | string;
  priority_label?: string;
  kind?: string | null;
  kind_label?: string | null;
  title: string;
  cause: string | null;
  description?: string | null;
  technician?: ApiTicketTechnician | null;
  maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  window_start: string | null;
  window_end: string | null;
  closed_at: string | null;
  resolution: string | null;
  created_at?: string;
  updated_at?: string;
};

export type GetTicketsResponse = {
  tickets: ApiTicket[];
};

export type GetTicketResponse = {
  ticket: ApiTicket;
};
