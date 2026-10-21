/**
 * Mock aislado. El Chat de producción usa `app-chat-gateway` (REST).
 * No inserta en `messages`. TODO(channel=app) vive en `channel-app-ingress`.
 */
import { notifyChannelAppIngress } from "@/lib/channel-app-ingress";
import type { AppMessage, OutboundClientDraft } from "@/types/domain";

export const APP_CONVERSATION_ID = 9001;

let nextId = 6;
let messages: AppMessage[] = [
  {
    id: 1,
    conversationId: APP_CONVERSATION_ID,
    type: "out",
    content:
      "¡Hola! 👋 Soy Nova, tu asistente virtual de Conexiones Innover. Te doy la bienvenida a nuestro canal oficial por app. ¿En qué te puedo colaborar hoy?",
    senderType: "bot",
    sentBy: "Nova",
    status: "sent",
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 2,
    conversationId: APP_CONVERSATION_ID,
    type: "in",
    content:
      "Hola Nova, buenas tardes. Quería consultar el estado de mi conexión de fibra en Valencia y confirmar el saldo a pagar de este mes.",
    senderType: "client",
    sentBy: null,
    status: "sent",
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: 3,
    conversationId: APP_CONVERSATION_ID,
    type: "out",
    content:
      "¡Con mucho gusto! 🚀 Tu servicio de Fibra Óptica 200 Mbps en Valencia se encuentra 100% activo con una latencia de 14 ms sin pérdidas de paquetes.\n\nTu saldo pendiente actual es de $30,00 (Bs. 26.141,07 a tasa oficial BCV de 871,37 Bs/$). Puedes realizar tu pago por Pago Móvil o Zelle y adjuntar el capture directamente por aquí o desde Inicio.",
    senderType: "bot",
    sentBy: "Nova",
    status: "sent",
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 4,
    conversationId: APP_CONVERSATION_ID,
    type: "in",
    content:
      "Excelente, muchas gracias. ¿Tienen cuadrillas de soporte técnico activas los fines de semana en caso de alguna avería?",
    senderType: "client",
    sentBy: null,
    status: "sent",
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    id: 5,
    conversationId: APP_CONVERSATION_ID,
    type: "out",
    content:
      "¡Sí, totalmente! Nuestro Centro de Operaciones de Red (NOC) monitorea la red de fibra 24/7 y contamos con técnicos de guardia asignados para resolver cualquier requerimiento en tu sector de forma prioritaria.",
    senderType: "bot",
    sentBy: "Nova",
    status: "sent",
    createdAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
  },
];

const cloneMessages = () => messages.map((message) => ({ ...message }));

export const fetchConversationMessages = async (): Promise<AppMessage[]> => {
  await new Promise((resolve) => setTimeout(resolve, 180));
  return cloneMessages();
};

export const sendClientDraft = async (
  draft: OutboundClientDraft,
): Promise<AppMessage> => {
  const inbound: AppMessage = {
    id: nextId,
    conversationId: APP_CONVERSATION_ID,
    type: "in",
    content: draft.content,
    senderType: "client",
    sentBy: null,
    status: "sent",
    createdAt: new Date().toISOString(),
    mediaType: draft.mediaType ?? null,
    mediaUrl: draft.mediaUrl ?? null,
    mimeType: draft.mimeType ?? null,
    caption: draft.caption ?? null,
    latitude: draft.latitude ?? null,
    longitude: draft.longitude ?? null,
    locationName: draft.locationName ?? null,
  };
  nextId += 1;
  messages = [...messages, inbound];

  const result = await notifyChannelAppIngress({
    conversationId: APP_CONVERSATION_ID,
    inboundMessage: inbound,
  });

  if (result.outbound) {
    nextId = Math.max(nextId, result.outbound.id + 1);
    messages = [...messages, result.outbound];
  }

  return inbound;
};

export const sendClientMessage = async (content: string) =>
  sendClientDraft({ content });

export const retryFailedDraft = async (draft: OutboundClientDraft) =>
  sendClientDraft(draft);
