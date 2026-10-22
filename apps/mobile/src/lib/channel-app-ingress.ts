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
    return "Puedes adjuntar tu comprobante por aquí usando el botón de imagen o desde Inicio. El saldo lo ves en Facturación.";
  }
  if (
    text.includes("falla") ||
    text.includes("lento") ||
    text.includes("avería") ||
    text.includes("sin internet") ||
    text.includes("caído") ||
    text.includes("rojo")
  ) {
    return "Lamento el inconveniente con tu servicio de fibra. Puedo ayudarte a reportar la falla para que el equipo técnico la revise.";
  }
  if (
    text.includes("saldo") ||
    text.includes("deuda") ||
    text.includes("cuánto debo") ||
    text.includes("monto")
  ) {
    return "Consulta tu saldo real en la pestaña Facturación. Aquí puedo ayudarte a registrar el comprobante.";
  }
  if (
    text.includes("plan") ||
    text.includes("velocidad") ||
    text.includes("megas") ||
    text.includes("fibra")
  ) {
    return "Tu plan y estado de contrato están en Inicio y Contrato. ¿Quieres que te ayude con otra consulta?";
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
