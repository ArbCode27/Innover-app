import type { AppMessage } from "@/types/domain";

export type ChannelAppIngressInput = {
  conversationId: number;
  inboundMessage: AppMessage;
};

export type ChannelAppIngressResult = {
  outbound: AppMessage | null;
};

const replyForInbound = (message: AppMessage) => {
  if (message.mediaType === "image") {
    return "¡Comprobante recibido! 📄 Ha quedado registrado en revisión por administración. En horario laboral te confirmamos la conciliación y actualización de tu cuenta.";
  }
  if (message.mediaType === "location") {
    return "Recibí tu ubicación. Si se abre una visita técnica en tu domicilio, la cuadrilla la utilizará para llegar directo a tu fachada.";
  }
  if (message.mediaType === "audio") {
    return "Recibí tu nota de voz. Nuestro equipo de soporte o yo la estamos procesando para atender tu solicitud.";
  }

  const text = message.content.toLowerCase();
  if (
    text.includes("pago") ||
    text.includes("comprobante") ||
    text.includes("transferencia") ||
    text.includes("zelle") ||
    text.includes("bcv")
  ) {
    return "Puedes adjuntar tu comprobante por aquí usando el botón de imagen o desde la pestaña Facturación. Tu saldo actual es $30,00 (Bs. 26.141,07 según tasa BCV).";
  }
  if (
    text.includes("falla") ||
    text.includes("lento") ||
    text.includes("avería") ||
    text.includes("sin internet") ||
    text.includes("caído") ||
    text.includes("rojo")
  ) {
    return "Lamento el inconveniente con tu servicio de fibra. He levantado un reporte preliminar de telemetría para tu sector en Valencia y notifiqué al NOC de guardia.";
  }
  if (
    text.includes("saldo") ||
    text.includes("deuda") ||
    text.includes("cuánto debo") ||
    text.includes("monto")
  ) {
    return "Tu saldo pendiente actual es de $30,00 (Bs. 26.141,07 según la tasa oficial BCV de 871,37 Bs/$). Puedes pagar con Pago Móvil o Zelle.";
  }
  if (
    text.includes("plan") ||
    text.includes("velocidad") ||
    text.includes("megas") ||
    text.includes("fibra")
  ) {
    return "Tu plan contratado es Fibra 200 Mbps simétrica 1:1 con router Wi-Fi 6 Gigabit de alta cobertura en Valencia.";
  }
  if (
    text.includes("gracias") ||
    text.includes("listo") ||
    text.includes("ok") ||
    text.includes("perfecto")
  ) {
    return "¡A tu orden! En Conexiones Innover estamos para mantenerte siempre conectado a máxima velocidad. ¿Puedo ayudarte en algo más?";
  }
  return "¡Recibido! He registrado tu consulta en el sistema. ¿Hay algo adicional en lo que te pueda colaborar con tu conexión de fibra óptica?";
};

/**
 * Único punto de ingreso del canal app hacia Nova.
 * TODO(channel=app): esto no existe en el CRM; hay que crearlo.
 * Hoy el CRM solo dispara replyToConversationWithAi desde el webhook de
 * Meta y /api/crm/ai/reply. Este módulo no llama Graph ni usa wamid.
 */
export const notifyChannelAppIngress = async (
  input: ChannelAppIngressInput,
): Promise<ChannelAppIngressResult> => {
  const now = new Date().toISOString();
  return {
    outbound: {
      id: input.inboundMessage.id + 1,
      conversationId: input.conversationId,
      type: "out",
      content: replyForInbound(input.inboundMessage),
      senderType: "bot",
      sentBy: "Nova",
      status: "sent",
      createdAt: now,
    },
  };
};
