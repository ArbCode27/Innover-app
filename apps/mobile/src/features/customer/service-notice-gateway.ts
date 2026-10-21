import type {
  ServiceNotice,
  ServiceNoticeKind,
} from "@/types/domain";

/**
 * Avisos de red para el abonado.
 * "esto no existe en el CRM; hay que crearlo" (GET /api/app/notices + FCM).
 */
const CATALOG: Record<
  ServiceNoticeKind,
  Omit<ServiceNotice, "id" | "createdAt">
> = {
  fiber_cut: {
    kind: "fiber_cut",
    severity: "critical",
    title: "Sin servicio por daño en la fibra",
    body: "Hay un corte total en tu enlace. El equipo técnico ya está en la zona trabajando la reparación.",
    cta: { label: "Escribir a soporte", action: "chat" },
  },
  power_warning: {
    kind: "power_warning",
    severity: "warning",
    title: "Potencia óptica fuera de rango",
    body: "La señal de tu fibra está alterada. Puedes notar lentitud o cortes intermitentes mientras lo revisamos.",
    cta: { label: "Consultar en el chat", action: "chat" },
  },
  zone_work: {
    kind: "zone_work",
    severity: "info",
    title: "Trabajo técnico en tu zona",
    body: "El equipo está realizando labores en tu sector. Mantente pendiente: puede haber una desconexión breve.",
  },
  service_restored: {
    kind: "service_restored",
    severity: "success",
    title: "El trabajo se realizó correctamente",
    body: "Ya puedes probar tu conexión. Si navegas estable, confírmalo por el chat para cerrar el aviso.",
    cta: { label: "Confirmar conexión en el chat", action: "chat-confirm" },
  },
};

export const SERVICE_NOTICE_KINDS: ServiceNoticeKind[] = [
  "fiber_cut",
  "power_warning",
  "zone_work",
  "service_restored",
];

export const buildServiceNotice = (kind: ServiceNoticeKind): ServiceNotice => {
  const template = CATALOG[kind];
  return {
    ...template,
    id: `svc-${kind}-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
};

export const formatNoticeTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Ahora";
  }
  const deltaMin = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (deltaMin < 1) {
    return "Hace un momento";
  }
  if (deltaMin === 1) {
    return "Hace 1 min";
  }
  if (deltaMin < 60) {
    return `Hace ${deltaMin} min`;
  }
  return date.toLocaleTimeString("es-VE", {
    hour: "numeric",
    minute: "2-digit",
  });
};
