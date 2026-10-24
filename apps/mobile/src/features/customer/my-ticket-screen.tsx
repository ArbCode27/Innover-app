import type { CustomerTabParamList } from "@/app/navigation-types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useGlassTabBarContentPadding } from "@/components/glass-tab-bar";
import { ScreenState } from "@/components/screen-state";
import { useAuthSession } from "@/features/auth/auth-session";
import {
  formatTicketInstant,
  formatTicketWindowBreakdown,
} from "@/features/customer/format-window";
import { customerTicketsQueryKey } from "@/features/chat/chat-cache";
import {
  fetchCustomerTicket,
  fetchCustomerTickets,
} from "@/features/customer/ticket-gateway";
import { noticeFromUnknown } from "@/lib/user-notice";
import { displayTicketStatus } from "@/features/customer/ticket-status-badge";
import type { AppCaso } from "@/types/domain";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  Calendar,
  Clock,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Ticket,
  UserCheck,
} from "lucide-react-native";
import * as React from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";

export const CustomerMyTicketScreen = () => {
  const { profile } = useAuthSession();
  const tabBarContentPadding = useGlassTabBarContentPadding();
  const navigation =
    useNavigation<BottomTabNavigationProp<CustomerTabParamList>>();

  const ticketQuery = useQuery({
    queryKey: customerTicketsQueryKey(profile?.userId),
    queryFn: () => fetchCustomerTickets(),
    enabled: Boolean(profile),
  });

  const tickets = ticketQuery.data ?? [];
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const listedTicket =
    tickets.find((item) => item.id === selectedId) ?? tickets[0] ?? null;

  const detailQuery = useQuery({
    queryKey: ["customer-ticket", listedTicket?.id],
    queryFn: () => fetchCustomerTicket(listedTicket?.id ?? ""),
    enabled: Boolean(listedTicket?.id),
  });

  const ticket = detailQuery.data ?? listedTicket;
  const closedAtLabel = ticket ? formatTicketInstant(ticket.closedAt) : null;
  const detailFailed = detailQuery.isError && Boolean(listedTicket);

  const handleRefresh = () => {
    void ticketQuery.refetch();
    void detailQuery.refetch();
  };
  const windowBreakdown = ticket
    ? formatTicketWindowBreakdown(ticket.windowStart, ticket.windowEnd)
    : null;

  const ticketNumber = (item: AppCaso) =>
    item.wisproPublicId != null ? `#${item.wisproPublicId}` : "Visita técnica";

  const statusCopy = (item: AppCaso) => {
    if (item.status === "done") {
      return "Esta visita ya fue cerrada.";
    }
    if (item.status === "cancelled") {
      return "Esta visita fue cancelada.";
    }
    if (item.status === "scheduled") {
      return item.employeeName
        ? `Hay una visita agendada con ${item.employeeName}.`
        : "Hay una visita agendada.";
    }
    return "Tu visita está registrada. El horario se confirma cuando el CRM la agenda.";
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-4 gap-5"
      contentContainerStyle={tabBarContentPadding}
      refreshControl={
        <RefreshControl
          refreshing={ticketQuery.isRefetching && !ticketQuery.isPending}
          onRefresh={handleRefresh}
        />
      }
    >
      {/* 1. Header Hero Oficial Conexiones Innover Soporte */}
      <View className="overflow-hidden rounded-3xl border border-border/80 bg-card/95 shadow-xl shadow-black/10">
        {/* Franja de Acento Tricolor Oficial (Carmesí Innover -> Azul Cobalto -> Cian FTTH) */}
        <View className="h-1.5 w-full flex-row">
          <View className="h-full flex-1 bg-destructive" />
          <View className="h-full flex-1 bg-primary" />
          <View className="h-full flex-1 bg-cyan-400" />
        </View>

        <View className="p-4 gap-3.5">
          {/* Fila Superior: Pill de Soporte Técnico + Botón Actualizar */}
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-row items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 dark:bg-cyan-950/40">
              <View className="size-2 rounded-full bg-cyan-500 shadow-sm shadow-cyan-400 dark:bg-cyan-400" />
              <Text className="text-[10px] font-extrabold tracking-wider text-cyan-800 uppercase dark:text-cyan-300">
                SOPORTE TÉCNICO · NOC INNOVER
              </Text>
            </View>

            <Pressable
              onPress={handleRefresh}
              accessibilityRole="button"
              accessibilityLabel="Actualizar estado del ticket"
              hitSlop={8}
              className="size-8 items-center justify-center rounded-full border border-border/80 bg-card active:bg-muted"
            >
              <Icon
                as={RefreshCw}
                size={13}
                className={ticketQuery.isRefetching ? "text-primary" : "text-muted-foreground"}
              />
            </Pressable>
          </View>

          {/* Titular */}
          <View className="gap-1">
            <View className="flex-row items-center gap-1.5">
              <View className="size-1.5 rounded-full bg-destructive" />
              <Text className="text-[10px] font-extrabold tracking-widest text-primary uppercase">
                ATENCIÓN DE INCIDENCIAS
              </Text>
            </View>
            <Text className="text-2xl font-black tracking-tight text-foreground">
              Seguimiento de Ticket
            </Text>
            <Text variant="muted" className="text-xs">
              Monitoreo en tiempo real de tu reporte y atención técnica en sitio.
            </Text>
          </View>
        </View>
      </View>

      <ScreenState
        isLoading={ticketQuery.isPending}
        isEmpty={!ticketQuery.isPending && !ticketQuery.isError && !ticket}
        emptyTitle="Sin tickets"
        emptyDescription="Cuando un asesor o Nova abra una visita técnica, la verás aquí. Tú no creas tickets desde la app."
        errorNotice={
          ticketQuery.isError
            ? noticeFromUnknown(
                ticketQuery.error,
                "No se pudieron cargar tus visitas",
              )
            : null
        }
        onRetry={handleRefresh}
      >
        {ticket ? (
          <View className="gap-5">
            {detailFailed ? (
              <Alert icon={ShieldCheck} className="border-destructive/40 bg-destructive/5">
                <AlertTitle className="text-xs font-bold">
                  No se pudo actualizar el detalle
                </AlertTitle>
                <AlertDescription className="text-[11px] leading-relaxed text-muted-foreground">
                  {noticeFromUnknown(
                    detailQuery.error,
                    "No se pudo cargar esta visita",
                  ).description}{" "}
                  Toca actualizar para intentarlo de nuevo.
                </AlertDescription>
              </Alert>
            ) : null}
            {tickets.length > 1 ? (
              <View className="gap-2">
                <Text className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Tus visitas técnicas
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {tickets.map((item) => {
                    const selected = item.id === ticket.id;
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => setSelectedId(item.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Ticket ${ticketNumber(item)}`}
                        className={`min-h-11 rounded-full border px-3 py-2 ${
                          selected
                            ? "border-primary bg-primary/15"
                            : "border-border/80 bg-card"
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            selected ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {ticketNumber(item)} ·{" "}
                          {displayTicketStatus(item.status, item.statusLabel)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}
            {/* 2. Hero Card del Ticket Activo */}
            <Card className="overflow-hidden border-2 border-amber-500/50 bg-card/95 shadow-xl shadow-black/15">
              {/* Franja superior de destaque en ámbar */}
              <View className="h-1.5 w-full bg-amber-500 dark:bg-amber-400" />

              <CardHeader className="gap-2.5">
                <View className="flex-row items-center justify-between gap-2">
                  <View className="flex-row items-center gap-2">
                    <Icon as={Ticket} size={18} className="text-amber-600 dark:text-amber-400" />
                    <CardTitle className="text-base font-black tracking-tight">
                      Ticket {ticketNumber(ticket)}
                    </CardTitle>
                  </View>

                  {/* Badge de estado con indicador luminoso */}
                  <View className="shrink-0 flex-row items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 dark:bg-amber-500/20">
                    <View className="size-2 rounded-full bg-amber-500 shadow-sm shadow-amber-400 dark:bg-amber-400" />
                    <Text className="text-xs font-extrabold text-amber-700 dark:text-amber-300">
                      {displayTicketStatus(ticket.status, ticket.statusLabel)}
                    </Text>
                  </View>
                </View>

                {/* Título de la avería */}
                {ticket.kindLabel ? (
                  <Text className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {ticket.kindLabel}
                  </Text>
                ) : null}

                <Text className="text-lg font-black tracking-tight text-foreground">
                  {ticket.title}
                </Text>

                {ticket.description ? (
                  <Text className="text-xs leading-relaxed text-muted-foreground">
                    {ticket.description}
                  </Text>
                ) : null}

                {/* Diagnóstico preliminar si está disponible */}
                {ticket.cause ? (
                  <View className="rounded-xl border border-border/80 bg-muted/30 p-3 gap-1">
                    <View className="flex-row items-center gap-1.5">
                      <Icon as={Activity} size={13} className="text-cyan-600 dark:text-cyan-400" />
                      <Text className="text-[10px] font-extrabold text-muted-foreground uppercase">
                        Diagnóstico Preliminar NOC:
                      </Text>
                    </View>
                    <Text className="text-xs font-semibold text-foreground leading-relaxed">
                      {ticket.cause}
                    </Text>
                  </View>
                ) : null}
              </CardHeader>

              <CardContent className="gap-4 pt-0">
                <View className="gap-2 rounded-2xl border border-border/70 bg-card/60 p-3.5">
                  <Text className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                    Estado de la visita
                  </Text>
                  <Text className="text-sm font-bold text-foreground">
                    {displayTicketStatus(ticket.status, ticket.statusLabel)}
                  </Text>
                  <Text className="text-xs leading-relaxed text-muted-foreground">
                    {statusCopy(ticket)}
                  </Text>
                  {closedAtLabel ? (
                    <Text className="text-[11px] text-muted-foreground">
                      Cierre: {closedAtLabel}
                    </Text>
                  ) : null}
                  {ticket.resolutionObservation ? (
                    <View className="mt-1 rounded-xl border border-border/80 bg-muted/30 p-3 gap-1">
                      <Text className="text-[10px] font-extrabold text-muted-foreground uppercase">
                        Observación de cierre
                      </Text>
                      <Text className="text-xs font-semibold text-foreground leading-relaxed">
                        {ticket.resolutionObservation}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Datos de la visita */}
                <View className="gap-2.5">
                  <Text className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                    Datos de la Visita:
                  </Text>

                  {/* Ventana horaria bien formateada */}
                  <View className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 gap-2">
                    <View className="flex-row items-center gap-2">
                      <View className="size-7 items-center justify-center rounded-lg bg-primary/10">
                        <Icon as={Calendar} size={15} className="text-primary" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[10px] font-bold text-muted-foreground uppercase">
                          Fecha estimada
                        </Text>
                        <Text className="text-sm font-black text-foreground">
                          {windowBreakdown?.dateLabel ?? "Fecha por confirmar"}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-2 border-t border-border/40 pt-2">
                      <View className="size-7 items-center justify-center rounded-lg bg-primary/10">
                        <Icon as={Clock} size={15} className="text-primary" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[10px] font-bold text-muted-foreground uppercase">
                          Rango de horario de atención
                        </Text>
                        <Text className="text-sm font-black text-foreground">
                          {windowBreakdown?.hoursLabel ?? "Pendiente por definir"}
                        </Text>
                      </View>
                    </View>

                    <Text className="mt-0.5 text-[10px] text-muted-foreground leading-relaxed">
                      El técnico te contactará vía telefónica antes de arribar a tu inmueble.
                    </Text>
                  </View>

                  {/* Técnico y Cuadrilla */}
                  <View className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 gap-2">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <View className="size-7 items-center justify-center rounded-lg bg-emerald-500/15">
                          <Icon as={UserCheck} size={15} className="text-emerald-600 dark:text-emerald-400" />
                        </View>
                        <View>
                          <Text className="text-[10px] font-bold text-muted-foreground uppercase">
                            Técnico Asignado
                          </Text>
                          <Text className="text-sm font-black text-foreground">
                            {ticket.employeeName ?? "Cuadrilla Especializada"}
                          </Text>
                        </View>
                      </View>

                      <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10">
                        <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          Certificado
                        </Text>
                      </Badge>
                    </View>

                    {ticket.technicianPhone ? (
                      <Text className="text-[10px] text-muted-foreground">
                        Teléfono del técnico: {ticket.technicianPhone}
                      </Text>
                    ) : (
                      <Text className="text-[10px] text-muted-foreground">
                        Especialista de Conexiones Innover. Te contacta antes de
                        llegar.
                      </Text>
                    )}
                  </View>

                </View>

                {/* 5. Alerta de Seguridad del Abonado */}
                <Alert icon={ShieldCheck} className="border-border/80 bg-card/80">
                  <AlertTitle className="text-xs font-bold">
                    Seguridad y Protocolo de Visita
                  </AlertTitle>
                  <AlertDescription className="text-[11px] leading-relaxed text-muted-foreground">
                    Los técnicos de Conexiones Innover visten uniforme
                    institucional. No solicitan pagos en efectivo bajo ningún
                    concepto.
                  </AlertDescription>
                </Alert>

                {/* 6. Botón de contacto directo por chat */}
                <Button
                  className="mt-1 min-h-12 h-12 w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary shadow-lg shadow-primary/30 active:opacity-90"
                  onPress={() => navigation.navigate("Chat")}
                  accessibilityLabel="Asesoría disponible las 24 horas"
                >
                  <Icon as={MessageSquare} size={16} className="text-primary-foreground" />
                  <Text className="text-xs font-bold text-primary-foreground uppercase tracking-wider">
                    Asesoría disponible 24/7
                  </Text>
                  <Icon as={ArrowRight} size={16} className="text-primary-foreground" />
                </Button>
                <Text className="text-center text-[10px] text-muted-foreground">
                  Nova te atiende a cualquier hora. Un asesor humano revisa en
                  horario de oficina.
                </Text>
              </CardContent>
            </Card>
          </View>
        ) : null}
      </ScreenState>
    </ScrollView>
  );
};
