import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  Ticket,
} from "lucide-react-native";
import { Pressable, View } from "react-native";

type QueueTicketCardProps = {
  caso: AppCaso;
  onOpenDetail: () => void;
  /** Cola pendiente (default) o listado de resueltos. */
  variant?: "pending" | "resolved";
};

export const QueueTicketCard = ({
  caso,
  onOpenDetail,
  variant = "pending",
}: QueueTicketCardProps) => {
  const chrome = ticketPriorityChrome(caso.priority);
  const windowLabel = formatTicketWindow(caso.windowStart, caso.windowEnd);
  const closedAtLabel = formatTicketInstant(caso.closedAt);
  const zone = caso.addressText?.trim() || "Sin zona";
  const clientName = caso.clientName?.trim() || "Cliente";
  const ticketLabel =
    caso.wisproPublicId != null ? `#${caso.wisproPublicId}` : null;
  const statusLabel = ticketStatusLabel(caso.status);
  const priorityLabel = ticketPriorityLabel(caso.priority, caso.priorityLabel);
  const observation = caso.resolutionObservation?.trim() || null;
  const isResolved = variant === "resolved";
  const accessibilitySummary = [
    `Ticket de ${clientName}`,
    `prioridad ${priorityLabel}`,
    `estado ${statusLabel}`,
    zone,
    isResolved && closedAtLabel ? `cierre ${closedAtLabel}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Pressable
      onPress={onOpenDetail}
      accessibilityRole="button"
      accessibilityLabel={accessibilitySummary}
      className="min-h-11 active:opacity-95"
    >
      <View
        className={cn(
          "overflow-hidden rounded-2xl border bg-card shadow-sm shadow-black/5",
          chrome.border,
        )}
      >
        <View className="flex-row">
          <View className={cn("w-1.5 self-stretch", chrome.bar)} />
          <View className={cn("flex-1 gap-3 p-4", chrome.tint)}>
            <View className="gap-2">
              <Text
                className="text-base font-semibold text-foreground"
                numberOfLines={2}
              >
                {clientName}
              </Text>
              <View className="flex-row flex-wrap items-center gap-2">
                <TicketPriorityBadge
                  priority={caso.priority}
                  priorityLabel={caso.priorityLabel}
                />
                <Badge variant="outline" className="shrink-0 px-2.5">
                  <Text className="text-xs font-medium text-foreground">
                    {statusLabel}
                  </Text>
                </Badge>
                {ticketLabel ? (
                  <Badge variant="secondary" className="shrink-0 gap-1 px-2.5">
                    <Icon
                      as={Ticket}
                      size={12}
                      className="text-secondary-foreground"
                    />
                    <Text className="text-xs font-medium text-secondary-foreground">
                      {ticketLabel}
                    </Text>
                  </Badge>
                ) : null}
              </View>
              <Text
                className="text-sm text-muted-foreground"
                numberOfLines={2}
              >
                {caso.title}
              </Text>
            </View>

            <View className="gap-2 rounded-xl border border-border/70 bg-card/80 px-3 py-2.5">
              <View className="flex-row items-start gap-2">
                <Icon as={MapPin} size={16} className={chrome.accentText} />
                <Text
                  className="flex-1 text-sm text-foreground"
                  numberOfLines={2}
                >
                  {zone}
                </Text>
              </View>
              {!isResolved && windowLabel ? (
                <View className="flex-row items-start gap-2">
                  <Icon as={Clock3} size={16} className={chrome.accentText} />
                  <Text
                    className="flex-1 text-sm text-foreground"
                    numberOfLines={2}
                  >
                    {windowLabel}
                  </Text>
                </View>
              ) : null}
              {isResolved && closedAtLabel ? (
                <View className="flex-row items-start gap-2">
                  <Icon
                    as={CalendarCheck2}
                    size={16}
                    className={chrome.accentText}
                  />
                  <Text
                    className="flex-1 text-sm text-foreground"
                    numberOfLines={2}
                  >
                    Cierre: {closedAtLabel}
                  </Text>
                </View>
              ) : null}
              {isResolved && observation ? (
                <View className="flex-row items-start gap-2">
                  <Icon
                    as={CheckCircle2}
                    size={16}
                    className={chrome.accentText}
                  />
                  <Text
                    className="flex-1 text-sm text-foreground"
                    numberOfLines={3}
                  >
                    {observation}
                  </Text>
                </View>
              ) : null}
            </View>

            <Button
              onPress={onOpenDetail}
              accessibilityLabel={`Ver detalle del ticket de ${clientName}`}
              className="w-full"
              variant={isResolved ? "outline" : "default"}
            >
              <Text>Ver detalle</Text>
              <Icon
                as={ChevronRight}
                size={18}
                className={
                  isResolved ? "text-foreground" : "text-primary-foreground"
                }
              />
            </Button>
          </View>
        </View>
      </View>
    </Pressable>
  );
};
