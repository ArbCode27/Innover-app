export type AppRole = "customer" | "technician" | "supervisor";

export type ClientAccountStatus =
  | "Al día"
  | "Con deuda"
  | "Suspendido"
  | "Prospecto";

export type ConversationStatus = "abierto" | "proceso" | "resuelto";

export type MessageType = "in" | "out" | "note";

export type MessageSenderType = "client" | "agent" | "bot" | "technician";

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
  hasDebt: boolean;
  debtUsdFormatted: string | null;
  debtBsFormatted: string | null;
  bcvRateDisplay: string | null;
  officeClosed: boolean;
  nextOpenLabel: string | null;
  planName: string | null;
  zone: string | null;
  periodLabel: string | null;
  dueHint: string | null;
  wisproLinked: boolean;
  billingStale: boolean;
  contractState: string | null;
  contractStateLabel: string | null;
  contractId: string | null;
  pendingInvoices: AppPendingInvoice[];
};

export type AppPendingInvoice = {
  id: string;
  invoiceNumber: string | null;
  state: string | null;
  balanceUsdFormatted: string;
  amountUsdFormatted: string;
  firstDueDate: string | null;
  periodTo: string | null;
  concept: string | null;
};

export type AppPaymentRecord = {
  id: string;
  status: PaymentStatus | string;
  amountFormatted: string | null;
  bank: string | null;
  paymentDate: string | null;
  transactionCode: string | null;
  createdAt: string | null;
  receiptMediaUrl: string | null;
};

export type PaymentMethodId =
  | "pago_movil"
  | "transferencia"
  | "deposito"
  | "deposito_usd";

export type PaymentCopyField = {
  label: string;
  value: string;
};

export type PaymentMethodOption = {
  id: PaymentMethodId;
  title: string;
  description: string | null;
};

export type PaymentInstructions = {
  methodId: PaymentMethodId;
  methodTitle: string;
  bankName: string;
  confirmAmountLabel: string;
  amountLine: string;
  fields: PaymentCopyField[];
  updatedAtLabel: string;
};

export type ContractSnapshot = {
  holderName: string | null;
  cedula: string | null;
  cedulaDisplay: string | null;
  planName: string | null;
  zone: string | null;
  contractState: string | null;
  contractStateLabel: string | null;
  contractId: string | null;
  accountStatus: ClientAccountStatus;
  wisproLinked: boolean;
  pppoeUsername: string | null;
  ipAddress: string | null;
};

export type AppMessage = {
  id: number;
  conversationId: number;
  type: Exclude<MessageType, "note">;
  content: string;
  senderType: MessageSenderType;
  sentBy: string | null;
  status: "pending" | "sent" | "delivered" | "read" | "failed";
  createdAt: string;
  mediaType?: MessageMediaType | null;
  mediaUrl?: string | null;
  mimeType?: string | null;
  caption?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string | null;
  locationAddress?: string | null;
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
  technicianPhone?: string | null;
  description?: string | null;
  kindLabel?: string | null;
  statusLabel?: string | null;
  priorityLabel?: string | null;
};

export type TeamTicketFilter = "pending" | "done" | "today";

export type TechnicianDirectoryEntry = {
  id: string;
  name: string;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type AppDevicePlatform = "android" | "ios" | "web";

export type AppDevice = {
  id: string;
  platform: AppDevicePlatform;
  label: string;
  lastSeenAt: string;
  isCurrent: boolean;
};

export type ServiceNoticeKind =
  | "fiber_cut"
  | "power_warning"
  | "zone_work"
  | "service_restored";

export type ServiceNoticeSeverity = "critical" | "warning" | "info" | "success";

export type ServiceNoticeCtaAction = "chat" | "ticket" | "chat-confirm";

export type ServiceNotice = {
  id: string;
  kind: ServiceNoticeKind;
  severity: ServiceNoticeSeverity;
  title: string;
  body: string;
  createdAt: string;
  cta?: {
    label: string;
    action: ServiceNoticeCtaAction;
  };
};
