import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import type { ClientAccountStatus } from "@/types/domain";

type AccountStatusBadgeProps = {
  status: ClientAccountStatus;
};

const variantForStatus = (status: ClientAccountStatus) => {
  if (status === "Suspendido") {
    return "destructive" as const;
  }
  if (status === "Con deuda") {
    return "outline" as const;
  }
  return "default" as const;
};

export const AccountStatusBadge = ({ status }: AccountStatusBadgeProps) => {
  return (
    <Badge
      variant={variantForStatus(status)}
      accessibilityLabel={`Estado de cuenta: ${status}`}
    >
      <Text>{status}</Text>
    </Badge>
  );
};
