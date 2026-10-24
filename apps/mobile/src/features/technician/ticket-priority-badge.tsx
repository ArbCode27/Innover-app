import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import {
  ticketPriorityChrome,
  ticketPriorityLabel,
} from "@/features/technician/ticket-priority";
import { cn } from "@/lib/utils";
import type { CasoPriority } from "@/types/domain";

type TicketPriorityBadgeProps = {
  priority: CasoPriority;
  priorityLabel?: string | null;
  className?: string;
  /** Solo el nivel (p. ej. «Urgente») sin el prefijo «Prioridad:». */
  compact?: boolean;
};

export const TicketPriorityBadge = ({
  priority,
  priorityLabel,
  className,
  compact = false,
}: TicketPriorityBadgeProps) => {
  const shortLabel = ticketPriorityLabel(priority, priorityLabel);
  const chrome = ticketPriorityChrome(priority);

  return (
    <Badge
      variant="secondary"
      className={cn("shrink-0", chrome.badge, className)}
      accessibilityLabel={`Prioridad: ${shortLabel}`}
    >
      <Text className={cn("text-xs font-semibold", chrome.badgeText)}>
        {compact ? shortLabel : `Prioridad: ${shortLabel}`}
      </Text>
    </Badge>
  );
};
