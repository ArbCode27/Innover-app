import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import {
  formatTicketInstant,
  formatTicketWindow,
} from "@/features/customer/format-window";
import { ticketStatusLabel } from "@/features/customer/ticket-status-badge";
import { TicketPriorityBadge } from "@/features/technician/ticket-priority-badge";
import {
  ticketPriorityChrome,
  ticketPriorityLabel,
} from "@/features/technician/ticket-priority";
import { cn } from "@/lib/utils";
import type { AppCaso } from "@/types/domain";
import {
  CalendarCheck2,
  ChevronRight,
  Clock3,
  MapPin,
  UserRound,
} from "lucide-react-native";
import { Pressable, View } from "react-native";

type TeamTicketCardProps = {
  caso: AppCaso;
  onOpen: () => void;
  /** Cuando la lista ya está agrupada o filtrada por técnico. */
  showTechnician?: boolean;
};

export const TeamTicketCard = ({
  caso,
  onOpen,
  showTechnician = false,
}: TeamTicketCardProps) => {
  const chrome = ticketPriorityChrome(caso.priority);
  const clientName = caso.clientName?.trim() || "Cliente";
  const zone = caso.addressText?.trim() || "Sin zona";
  const windowLabel = formatTicketWindow(caso.windowStart, caso.windowEnd);
  const closedAtLabel = formatTicketInstant(caso.closedAt);
  const isResolved = caso.status === "done" || caso.status === "cancelled";
  const statusLabel = ticketStatusLabel(caso.status);
  const priorityLabel = ticketPriorityLabel(caso.priority, caso.priorityLabel);
  const ticketLabel =
    caso.wisproPublicId != null ? `#${caso.wisproPublicId}` : null;
  const technicianName = caso.employeeName?.trim() || "Sin asignar";
  const title = caso.title?.trim() || "Sin título";

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={[
        `Ticket de ${clientName}`,
        `prioridad ${priorityLabel}`,
        `estado ${statusLabel}`,
        zone,
      ].join(", ")}
      className="min-h-11 active:opacity-95"
    >
      <View
        className={cn(
          "overflow-hidden rounded-xl border bg-card",
          chrome.border,
        )}
      >
        <View className="flex-row">
          <View className={cn("w-1 self-stretch", chrome.bar)} />
          <View className={cn("flex-1 gap-2 px-3 py-2.5", chrome.tint)}>
            <View className="flex-row items-start justify-between gap-2">
              <View className="min-w-0 flex-1 gap-1">
                <Text
                  className="text-[15px] font-semibold leading-5 text-foreground"
                  numberOfLines={1}
                >
                  {clientName}
                </Text>
                <Text
                  className="text-xs leading-4 text-muted-foreground"
                  numberOfLines={1}
                >
                  {title}
                </Text>
              </View>
              <Icon
                as={ChevronRight}
                size={18}
                className="mt-0.5 text-muted-foreground"
              />
            </View>

            <View className="flex-row flex-wrap items-center gap-1.5">
              <TicketPriorityBadge
                priority={caso.priority}
                priorityLabel={caso.priorityLabel}
                compact
                className="px-2 py-0"
              />
              <Badge variant="outline" className="px-2 py-0">
                <Text className="text-[11px] font-medium text-foreground">
                  {statusLabel}
                </Text>
              </Badge>
              {ticketLabel ? (
                <Badge variant="secondary" className="px-2 py-0">
                  <Text className="text-[11px] font-medium text-secondary-foreground">
                    {ticketLabel}
                  </Text>
                </Badge>
              ) : null}
            </View>

            <View className="gap-1">
              <View className="flex-row items-center gap-1.5">
                <Icon as={MapPin} size={13} className={chrome.accentText} />
                <Text
                  className="flex-1 text-xs text-foreground"
                  numberOfLines={1}
                >
                  {zone}
                </Text>
              </View>
              {isResolved && closedAtLabel ? (
                <View className="flex-row items-center gap-1.5">
                  <Icon
                    as={CalendarCheck2}
                    size={13}
                    className={chrome.accentText}
                  />
                  <Text
                    className="flex-1 text-xs text-foreground"
                    numberOfLines={1}
                  >
                    Cierre: {closedAtLabel}
                  </Text>
                </View>
              ) : windowLabel ? (
                <View className="flex-row items-center gap-1.5">
                  <Icon as={Clock3} size={13} className={chrome.accentText} />
                  <Text
                    className="flex-1 text-xs text-foreground"
                    numberOfLines={1}
                  >
                    {windowLabel}
                  </Text>
                </View>
              ) : null}
              {showTechnician ? (
                <View className="flex-row items-center gap-1.5">
                  <Icon
                    as={UserRound}
                    size={13}
                    className={chrome.accentText}
                  />
                  <Text
                    className="flex-1 text-xs text-foreground"
                    numberOfLines={1}
                  >
                    {technicianName}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
};
