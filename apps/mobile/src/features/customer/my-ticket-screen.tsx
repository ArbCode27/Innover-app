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
import { ScreenState } from "@/components/screen-state";
import { useAuthSession } from "@/features/auth/auth-session";
import { formatTicketWindowBreakdown } from "@/features/customer/format-window";
import { fetchCustomerOpenTicket } from "@/features/customer/ticket-gateway";
import { ticketStatusLabel } from "@/features/customer/ticket-status-badge";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  Calendar,
  Check,
  Clock,
  ExternalLink,
  MapPin,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Ticket,
  UserCheck,
} from "lucide-react-native";
import * as React from "react";
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";

export const CustomerMyTicketScreen = () => {
  const { profile } = useAuthSession();
  const navigation =
    useNavigation<BottomTabNavigationProp<CustomerTabParamList>>();

  const ticketQuery = useQuery({
    queryKey: ["customer-open-ticket", profile?.userId],
    queryFn: () => fetchCustomerOpenTicket(profile),
  });

  const handleRefresh = () => {
    void ticketQuery.refetch();
  };

  const ticket = ticketQuery.data ?? null;
  const windowBreakdown = ticket
    ? formatTicketWindowBreakdown(ticket.windowStart, ticket.windowEnd)
    : null;

  const handleOpenMaps = async () => {
    if (!ticket?.mapsUrl) return;
    try {
      await Linking.openURL(ticket.mapsUrl);
    } catch {
      // Ignoramos error de apertura de URL externa
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-4 gap-5 pb-12"
      refreshControl={
        <RefreshControl
          refreshing={ticketQuery.isRefetching && !ticketQuery.isPending}
          onRefresh={handleRefresh}
        />
      }
    >
      {/* 1. Header corporativo estilo Star Conectados */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-1 flex-row items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1.5 shadow-sm shadow-cyan-500/10 dark:bg-cyan-950/30">
            <View className="size-2 rounded-full bg-cyan-500 shadow-sm shadow-cyan-400 dark:bg-cyan-400" />
            <Text
              numberOfLines={1}
              className="flex-1 text-[10px] font-extrabold tracking-wider text-cyan-800 uppercase dark:text-cyan-300"
            >
              SOPORTE TÉCNICO · FTTH NOC INNOVER
            </Text>
          </View>

          <Pressable
            onPress={handleRefresh}
            accessibilityRole="button"
            accessibilityLabel="Actualizar estado del ticket"
            className="shrink-0 flex-row items-center gap-1.5 rounded-full border border-border/80 bg-card/80 px-2.5 py-1.5"
          >
            <Icon as={RefreshCw} size={12} className="text-muted-foreground" />
            <Text className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              Actualizar
            </Text>
          </Pressable>
        </View>

        {/* Barra de acento degradado carmesí a azul cobalto */}
        <View className="h-1 w-full overflow-hidden rounded-full bg-muted/40">
          <View className="h-full w-full flex-row">
            <View className="h-full flex-1 bg-destructive" />
            <View className="h-full flex-1 bg-primary" />
            <View className="h-full flex-1 bg-cyan-400" />
          </View>
        </View>

        {/* Titular */}
        <View className="gap-1 pt-1">
          <Text variant="muted" className="text-xs font-bold tracking-widest uppercase">
            ATENCIÓN DE INCIDENCIAS
          </Text>
          <Text className="text-2xl font-black tracking-tight text-foreground">
            Seguimiento de Ticket
          </Text>
          <Text variant="muted" className="text-xs">
            Monitoreo en tiempo real de tu reporte y atención técnica en sitio.
          </Text>
        </View>
      </View>

      <ScreenState
        isLoading={ticketQuery.isPending}
        isEmpty={!ticketQuery.isPending && !ticketQuery.isError && !ticket}
        emptyTitle="Sin tickets abiertos"
        emptyDescription="No tienes ningún caso pendiente en tu enlace de fibra óptica. Tu servicio se encuentra operativo."
        errorMessage={
          ticketQuery.isError ? "No se pudo cargar el estado de tu ticket." : null
        }
        onRetry={handleRefresh}
      >
        {ticket ? (
          <View className="gap-5">
            {/* 2. Hero Card del Ticket Activo */}
            <Card className="overflow-hidden border-2 border-amber-500/50 bg-card/95 shadow-xl shadow-black/15">
              {/* Franja superior de destaque en ámbar */}
              <View className="h-1.5 w-full bg-amber-500 dark:bg-amber-400" />

              <CardHeader className="gap-2.5">
                <View className="flex-row items-center justify-between gap-2">
                  <View className="flex-row items-center gap-2">
                    <Icon as={Ticket} size={18} className="text-amber-600 dark:text-amber-400" />
                    <CardTitle className="text-base font-black tracking-tight">
                      Ticket #{ticket.wisproPublicId ?? ticket.id}
                    </CardTitle>
                  </View>

                  {/* Badge de estado con indicador luminoso */}
                  <View className="shrink-0 flex-row items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 dark:bg-amber-500/20">
                    <View className="size-2 rounded-full bg-amber-500 shadow-sm shadow-amber-400 dark:bg-amber-400" />
                    <Text className="text-xs font-extrabold text-amber-700 dark:text-amber-300">
                      {ticketStatusLabel(ticket.status)}
                    </Text>
                  </View>
                </View>

                {/* Título de la avería */}
                <Text className="text-lg font-black tracking-tight text-foreground">
                  {ticket.title}
                </Text>

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
                {/* 3. Etapas de atención / Stepper visual */}
                <View className="gap-2 rounded-2xl border border-border/70 bg-card/60 p-3.5">
                  <Text className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                    Línea de tiempo de atención:
                  </Text>

                  <View className="gap-3 pt-1">
                    {/* Paso 1: Reportado */}
                    <View className="flex-row items-start gap-3">
                      <View className="mt-0.5 size-5 items-center justify-center rounded-full bg-emerald-500/20">
                        <Icon as={Check} size={12} className="text-emerald-600 dark:text-emerald-400" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-foreground">
                          1. Reporte recibido
                        </Text>
                        <Text className="text-[10px] text-muted-foreground">
                          Registrado en sistema y priorizado por el NOC.
                        </Text>
                      </View>
                    </View>

                    {/* Paso 2: Diagnóstico y Cuadrilla */}
                    <View className="flex-row items-start gap-3">
                      <View className="mt-0.5 size-5 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/50">
                        <View className="size-2 rounded-full bg-amber-500 dark:bg-amber-400" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-amber-700 dark:text-amber-400">
                          2. Cuadrilla técnica asignada (En curso)
                        </Text>
                        <Text className="text-[10px] text-muted-foreground">
                          {ticket.employeeName ? `Técnico ${ticket.employeeName} agendado para atención.` : "Asignando especialista de campo."}
                        </Text>
                      </View>
                    </View>

                    {/* Paso 3: Inspección en sitio */}
                    <View className="flex-row items-start gap-3">
                      <View className="mt-0.5 size-5 items-center justify-center rounded-full bg-muted/60">
                        <View className="size-1.5 rounded-full bg-muted-foreground" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-semibold text-muted-foreground">
                          3. Inspección en domicilio
                        </Text>
                        <Text className="text-[10px] text-muted-foreground">
                          Medición de potencia óptica en conector y caja NAP.
                        </Text>
                      </View>
                    </View>

                    {/* Paso 4: Resolución */}
                    <View className="flex-row items-start gap-3">
                      <View className="mt-0.5 size-5 items-center justify-center rounded-full bg-muted/60">
                        <View className="size-1.5 rounded-full bg-muted-foreground" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-semibold text-muted-foreground">
                          4. Cierre y verificación de navegación
                        </Text>
                        <Text className="text-[10px] text-muted-foreground">
                          Confirmación de simetría y estabilidad del enlace.
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 4. Detalles de la visita programada */}
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

                    <Text className="text-[10px] text-muted-foreground">
                      Especialista en tendido y empalme de fibra óptica FTTH · Conexiones Innover
                    </Text>
                  </View>

                  {/* Dirección y Ubicación */}
                  {ticket.addressText ? (
                    <View className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 gap-2">
                      <View className="flex-row items-center gap-2">
                        <View className="size-7 items-center justify-center rounded-lg bg-cyan-500/15">
                          <Icon as={MapPin} size={15} className="text-cyan-600 dark:text-cyan-400" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-[10px] font-bold text-muted-foreground uppercase">
                            Dirección de Atención
                          </Text>
                          <Text className="text-xs font-bold text-foreground">
                            {ticket.addressText}
                          </Text>
                        </View>
                      </View>

                      {ticket.mapsUrl ? (
                        <Pressable
                          onPress={() => {
                            void handleOpenMaps();
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Abrir ubicación en Google Maps"
                          className="mt-1 flex-row items-center justify-center gap-2 rounded-xl border border-border/70 bg-card/60 py-2 active:opacity-80"
                        >
                          <Icon as={ExternalLink} size={13} className="text-primary" />
                          <Text className="text-xs font-bold text-primary">
                            Ver ubicación en Google Maps
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ) : null}
                </View>

                {/* 5. Alerta de Seguridad del Abonado */}
                <Alert icon={ShieldCheck} className="border-border/80 bg-card/80">
                  <AlertTitle className="text-xs font-bold">
                    Seguridad y Protocolo de Visita
                  </AlertTitle>
                  <AlertDescription className="text-[11px] leading-relaxed text-muted-foreground">
                    Los técnicos de Conexiones Innover visten uniforme institucional y portan carnet oficial con código QR. No solicitan claves ni pagos en efectivo bajo ningún concepto.
                  </AlertDescription>
                </Alert>

                {/* 6. Botón de contacto directo por chat */}
                <Button
                  className="mt-1 min-h-12 h-12 w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary shadow-lg shadow-primary/30 active:opacity-90"
                  onPress={() => navigation.navigate("Chat")}
                  accessibilityLabel="Consultar estado con Nova o un asesor"
                >
                  <Icon as={MessageSquare} size={16} className="text-primary-foreground" />
                  <Text className="text-xs font-bold text-primary-foreground uppercase tracking-wider">
                    Consultar en Chat con Soporte
                  </Text>
                  <Icon as={ArrowRight} size={16} className="text-primary-foreground" />
                </Button>
              </CardContent>
            </Card>
          </View>
        ) : null}
      </ScreenState>
    </ScrollView>
  );
};
