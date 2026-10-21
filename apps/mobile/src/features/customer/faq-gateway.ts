import type { FaqItem } from "@/types/domain";

/**
 * Preguntas frecuentes del portal de abonado.
 * "esto no existe en el CRM; hay que crearlo" (ver docs/BACKEND_GAPS.md).
 */
const FAQ_ITEMS: FaqItem[] = [
  {
    id: "registrar-pago",
    question: "¿Cómo registro un pago?",
    answer:
      "Entra a Facturación y pulsa Pagar servicio. Elige el método (Pago Móvil, transferencia o depósito), confirma los datos de Conexiones Innover, anota la referencia y adjunta la foto del comprobante. Queda recibido y en revisión.",
  },
  {
    id: "revision-comprobante",
    question: "¿Cuánto tarda en revisarse el comprobante?",
    answer:
      "Puedes registrar el pago a cualquier hora. Un asesor lo valida en el CRM en horario de oficina. En la app el estado es recibido o en revisión; no aparece como aprobado desde el teléfono.",
  },
  {
    id: "sin-internet",
    question: "¿Qué hago si no tengo internet?",
    answer:
      "Revisa el estado de tu conexión en Inicio. Si hay una incidencia, entra a Mi ticket para ver el caso y la ventana de visita. También puedes reportar la falla desde el chat con Nova.",
  },
  {
    id: "pago-fuera-horario",
    question: "¿Puedo pagar fuera de horario de oficina?",
    answer:
      "Sí. Los pagos se registran las 24 horas. La validación humana se hace en horario de oficina. Nova puede orientarte en cualquier momento.",
  },
  {
    id: "tasa-bcv",
    question: "¿A cuál tasa se cobra en bolívares?",
    answer:
      "Se usa la tasa oficial BCV que envía el servidor. En Inicio y Facturación verás el saldo en dólares, el equivalente en bolívares y la tasa del día, sin recálculos en el teléfono.",
  },
  {
    id: "ver-ticket",
    question: "¿Cómo veo mi ticket técnico?",
    answer:
      "Abre la pestaña Mi ticket. Ahí aparece el número público del caso, el diagnóstico, el técnico asignado y el horario de visita cuando ya existe un caso abierto.",
  },
];

export const fetchFaqItems = async (): Promise<FaqItem[]> => {
  await new Promise((resolve) => setTimeout(resolve, 160));
  return FAQ_ITEMS.map((item) => ({ ...item }));
};

export const fetchHomeFaqPreview = async (): Promise<FaqItem[]> => {
  const items = await fetchFaqItems();
  return items.filter((item) =>
    ["registrar-pago", "sin-internet", "tasa-bcv"].includes(item.id),
  );
};
