import type { SupervisorStackParamList } from "@/app/navigation-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { ScreenState } from "@/components/screen-state";
import { useAuthSession } from "@/features/auth/auth-session";
import {
  formatTicketInstant,
  formatTicketWindow,
} from "@/features/customer/format-window";
import { ticketStatusLabel } from "@/features/customer/ticket-status-badge";
import { fetchSupervisorTicketDetail } from "@/features/supervisor/supervisor-gateway";
import {
  openCasoInMaps,
  resolveCasoMapsUrl,
} from "@/features/technician/maps-opener";
import { TicketPriorityBadge } from "@/features/technician/ticket-priority-badge";
import { ticketPriorityChrome } from "@/features/technician/ticket-priority";
import { toUserFacingMessage } from "@/lib/user-facing-error";
import { cn } from "@/lib/utils";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  CalendarCheck2,
  Clock3,
  Eye,
  ImageIcon,
  MapPin,
  Navigation,
  Phone,
  Ticket,
  UserRound,
  Wrench,
} from "lucide-react-native";
import * as React from "react";
import { Image, ScrollView, View } from "react-native";

const InfoRow = ({
  icon,
  label,
  value,
  accentClassName,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  accentClassName: string;
}) => (
  <View className="flex-row items-start gap-3">
    <View
      className={cn(
        "mt-0.5 h-9 w-9 items-center justify-center rounded-xl bg-card",
        "border border-border/70",
      )}
    >
      <Icon as={icon} size={18} className={accentClassName} />
    </View>
    <View className="min-w-0 flex-1 gap-0.5">
      <Text className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Text>
      <Text className="text-base text-foreground">{value}</Text>
    </View>
  </View>
);

export const SupervisorTicketDetailScreen = () => {
  const { profile } = useAuthSession();
  const route =
    useRoute<RouteProp<SupervisorStackParamList, "TicketDetalle">>();
  const casoId = route.params.casoId;
  const [mapsError, setMapsError] = React.useState<string | null>(null);

  const detailQuery = useQuery({
    queryKey: ["supervisor-ticket", profile?.userId, casoId],
    queryFn: () => fetchSupervisorTicketDetail(profile, casoId),
    enabled: profile?.role === "supervisor" && Boolean(casoId),
  });

  const caso = detailQuery.data ?? null;
  const chrome = caso ? ticketPriorityChrome(caso.priority) : null;
  const windowLabel = caso
    ? formatTicketWindow(caso.windowStart, caso.windowEnd)
    : null;
  const ticketLabel =
    caso?.wisproPublicId != null ? `#${caso.wisproPublicId}` : null;
  const mapsUrl = caso ? resolveCasoMapsUrl(caso) : null;
  const clientName = caso?.clientName?.trim() || "Cliente";
  const statusLabel = caso ? ticketStatusLabel(caso.status) : "";
  const technicianName = caso?.employeeName?.trim() || "Sin asignar";
  const isResolved = caso?.status === "done" || caso?.status === "cancelled";
  const closedAtLabel = caso ? formatTicketInstant(caso.closedAt) : null;

  const handleOpenMaps = async () => {
    if (!caso || !mapsUrl) {
      return;
    }
    setMapsError(null);
    try {
      await openCasoInMaps(caso);
    } catch (error) {
      setMapsError(
        toUserFacingMessage(
          error,
          "No se pudo abrir Maps. Inténtalo de nuevo.",
        ),
      );
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenState
        isLoading={detailQuery.isPending}
        isEmpty={!detailQuery.isPending && !detailQuery.isError && !caso}
        emptyTitle="No encontramos ese ticket"
        emptyDescription="Puede haberse cerrado o no pertenecer a tu organización."
        errorMessage={
          detailQuery.isError ? "No se pudo cargar el detalle." : null
        }
        onRetry={() => {
          void detailQuery.refetch();
        }}
      >
        {caso && chrome ? (
          <ScrollView contentContainerClassName="gap-4 p-4 pb-10">
            <View className="flex-row items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-2.5">
              <Icon as={Eye} size={16} className="text-muted-foreground" />
              <Text className="flex-1 text-xs leading-4 text-muted-foreground">
                Solo lectura · no puedes cerrar visitas de otros técnicos
              </Text>
            </View>

            <View
              className={cn(
                "overflow-hidden rounded-2xl border bg-card shadow-sm shadow-black/5",
                chrome.border,
              )}
            >
              <View className="flex-row">
                <View className={cn("w-1.5 self-stretch", chrome.bar)} />
                <View className={cn("flex-1 gap-4 p-4", chrome.tint)}>
                  <View className="gap-2">
                    <Text className="text-xl font-semibold text-foreground">
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
                        <Badge
                          variant="secondary"
                          className="shrink-0 gap-1 px-2.5"
                        >
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
                    <Text className="text-base text-muted-foreground">
                      {caso.title}
                    </Text>
                  </View>

                  <View className="gap-3.5 rounded-2xl border border-border/70 bg-card/90 px-3.5 py-3.5">
                    <InfoRow
                      icon={UserRound}
                      label="Técnico"
                      value={technicianName}
                      accentClassName={chrome.accentText}
                    />
                    <InfoRow
                      icon={Wrench}
                      label="Causa"
                      value={caso.cause?.trim() || caso.title}
                      accentClassName={chrome.accentText}
                    />
                    <InfoRow
                      icon={MapPin}
                      label="Zona"
                      value={caso.addressText?.trim() || "Sin zona"}
                      accentClassName={chrome.accentText}
                    />
                    <InfoRow
                      icon={Clock3}
                      label="Ventana horaria"
                      value={windowLabel ?? "Sin ventana asignada"}
                      accentClassName={chrome.accentText}
                    />
                    {isResolved && closedAtLabel ? (
                      <InfoRow
                        icon={CalendarCheck2}
                        label="Fecha de cierre"
                        value={closedAtLabel}
                        accentClassName={chrome.accentText}
                      />
                    ) : null}
                    {caso.clientPhone ? (
                      <InfoRow
                        icon={Phone}
                        label="Teléfono"
                        value={caso.clientPhone}
                        accentClassName={chrome.accentText}
                      />
                    ) : null}
                  </View>

                  {mapsUrl ? (
                    <View className="w-full gap-2">
                      <Button
                        onPress={() => {
                          void handleOpenMaps();
                        }}
                        accessibilityLabel="Abrir en Maps"
                        className="w-full"
                      >
                        <Icon
                          as={Navigation}
                          size={18}
                          className="text-primary-foreground"
                        />
                        <Text>Abrir en Maps</Text>
                      </Button>
                      {mapsError ? (
                        <Text className="text-sm text-destructive">
                          {mapsError}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {caso.facadeMediaUrl ? (
              <View className="overflow-hidden rounded-2xl border border-border bg-card">
                <View className="flex-row items-center gap-2 border-b border-border px-4 py-3">
                  <Icon as={ImageIcon} size={18} className="text-primary" />
                  <Text className="font-semibold text-foreground">Fachada</Text>
                </View>
                <Image
                  source={{ uri: caso.facadeMediaUrl }}
                  className="h-52 w-full"
                  accessibilityLabel="Foto de fachada"
                  resizeMode="cover"
                />
              </View>
            ) : null}

            {isResolved && (caso.resolutionObservation || closedAtLabel) ? (
              <View className="gap-2 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-4">
                <View className="flex-row items-center gap-2">
                  <Icon
                    as={CheckCircle2}
                    size={18}
                    className="text-emerald-700 dark:text-emerald-300"
                  />
                  <Text className="font-semibold text-emerald-700 dark:text-emerald-300">
                    {caso.resolutionObservation
                      ? "Observación de cierre"
                      : "Visita cerrada"}
                  </Text>
                </View>
                {closedAtLabel ? (
                  <Text className="text-sm text-muted-foreground">
                    Cerrado: {closedAtLabel}
                  </Text>
                ) : null}
                {caso.resolutionObservation ? (
                  <Text className="text-base text-foreground">
                    {caso.resolutionObservation}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </ScrollView>
        ) : null}
      </ScreenState>
    </View>
  );
};
