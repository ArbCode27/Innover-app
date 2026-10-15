export type AppRole = "customer" | "technician" | "supervisor";

export type ClientAccountStatus =
  | "Al día"
  | "Con deuda"
  | "Suspendido"
  | "Prospecto";

export type ConversationStatus = "abierto" | "proceso" | "resuelto";

export type MessageType = "in" | "out" | "note";

export type MessageSenderType = "client" | "agent" | "bot";

export type MessageMediaType =
  | "audio"
  | "image"
  | "video"
  | "document"
  | "location";

export type ConversationChannel = "app";

export type ConversationActorType = "customer" | "technician";

export type CasoStatus = "open" | "scheduled" | "done" | "cancelled";

export type CasoPriority = "low" | "medium" | "high" | "urgent";

export type PaymentStatus =
  | "RECIBIDO"
  | "EN_PROCESO"
  | "APROBADO"
  | "RECHAZADO"
  | "DUPLICADO"
  | "ERROR";

export type AppProfile = {
  userId: string;
  role: AppRole;
  displayName: string;
  clientId: number | null;
  technicianId: string | null;
  supervisorId: string | null;
  loginCedula: string | null;
};

export type AccountQuote = {
  accountStatus: ClientAccountStatus;
  serviceSuspended: boolean;
  debtUsdFormatted: string;
  debtBsFormatted: string | null;
  bcvRateDisplay: string | null;
  officeClosed: boolean;
  nextOpenLabel: string | null;
  planName: string | null;
  zone: string | null;
};

export type ContractSnapshot = {
  holderName: string | null;
  cedula: string | null;
  planName: string | null;
  zone: string | null;
  contractState: string | null;
  accountStatus: ClientAccountStatus;
  ipAddress: string | null;
};

export type AppMessage = {
  id: number;
  conversationId: number;
  type: Exclude<MessageType, "note">;
  content: string;
  senderType: MessageSenderType;
  sentBy: string | null;
  status: "pending" | "sent" | "failed";
  createdAt: string;
  mediaType?: MessageMediaType | null;
  mediaUrl?: string | null;
  mimeType?: string | null;
  caption?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string | null;
};

export type OutboundClientDraft = {
  content: string;
  mediaType?: MessageMediaType | null;
  mediaUrl?: string | null;
  mimeType?: string | null;
  fileName?: string | null;
  caption?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string | null;
};

export type AppCaso = {
  id: string;
  wisproIssueId: string | null;
  wisproPublicId: number | null;
  title: string;
  cause: string | null;
  status: CasoStatus;
  priority: CasoPriority;
  clientName: string | null;
  clientPhone: string | null;
  mapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  addressText: string | null;
  windowStart: string | null;
  windowEnd: string | null;
  facadeMediaUrl: string | null;
  resolutionObservation: string | null;
  employeeId: string | null;
  employeeName: string | null;
  closedAt: string | null;
};

export type TeamTicketFilter = "pending" | "done" | "today";

export type TechnicianDirectoryEntry = {
  id: string;
  name: string;
};
