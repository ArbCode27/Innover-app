import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import type { CasoStatus } from "@/types/domain";

const LABEL: Record<CasoStatus, string> = {
  open: "Abierto",
  scheduled: "Agendado",
  done: "Resuelto",
  cancelled: "Cancelado",
};

const variantForStatus = (status: CasoStatus) => {
  if (status === "cancelled") {
    return "destructive" as const;
  }
  if (status === "done") {
    return "secondary" as const;
  }
  return "default" as const;
};

export const ticketStatusLabel = (status: CasoStatus) => LABEL[status];

export const TicketStatusBadge = ({ status }: { status: CasoStatus }) => {
  const label = LABEL[status];
  return (
    <Badge
      variant={variantForStatus(status)}
      accessibilityLabel={`Estado del ticket: ${label}`}
    >
      <Text>{label}</Text>
    </Badge>
  );
};
