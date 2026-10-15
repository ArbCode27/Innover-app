import type { CustomerTabParamList } from "@/app/navigation-types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { ScreenState } from "@/components/screen-state";
import { useAuthSession } from "@/features/auth/auth-session";
import { AccountStatusBadge } from "@/features/customer/account-status-badge";
import { fetchAccountQuote } from "@/features/customer/account-quote-gateway";
import {
  fetchCustomerOpenTicket,
  MOCK_CUSTOMER_TICKET,
} from "@/features/customer/ticket-gateway";
import { ticketStatusLabel } from "@/features/customer/ticket-status-badge";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Info,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Ticket,
  UserCheck,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react-native";
import * as React from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";

type ConnectionStateMode = "active" | "issue" | "cut";

export const CustomerHomeScreen = () => {
  const { profile } = useAuthSession();
  const navigation =
    useNavigation<BottomTabNavigationProp<CustomerTabParamList>>();

  // Por ahora mostramos datos mockeados con selector interactivo de los 3 estados
  const [selectedState, setSelectedState] =
    React.useState<ConnectionStateMode>("active");

  const quoteQuery = useQuery({
    queryKey: ["account-quote"],
    queryFn: fetchAccountQuote,
  });

  const ticketQuery = useQuery({
    queryKey: ["customer-open-ticket", profile?.userId],
    queryFn: () => fetchCustomerOpenTicket(profile),
  });

  const isRefreshing = quoteQuery.isRefetching || ticketQuery.isRefetching;

  const handleRefresh = () => {
    void quoteQuery.refetch();
    void ticketQuery.refetch();
  };

  const quote = quoteQuery.data;
  const openTicket = ticketQuery.data ?? MOCK_CUSTOMER_TICKET;

  // Datos mockeados de identidad de abonado
  const subscriberName =
    profile?.displayName && profile.displayName !== "Abonado" && profile.displayName !== "Cliente"
      ? profile.displayName
      : "Carlos Silva";
  const subscriberCedula = profile?.loginCedula
    ? `V-${profile.loginCedula}`
    : "V-18.765.432";
  const contractNumber = "FTTH-2026-0842";
  const zoneName = quote?.zone ?? "Valencia · Urb. El Parral";

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-4 gap-5 pb-12"
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing && !quoteQuery.isPending}
          onRefresh={handleRefresh}
        />
      }
    >
      {/* 1. Header estilo Star Conectados */}
      <View className="gap-3">
        {/* Pill de red de fibra de alta velocidad con contraste dual light/dark */}
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-1 flex-row items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1.5 shadow-sm shadow-cyan-500/10 dark:bg-cyan-950/30">
            <View className="size-2 rounded-full bg-cyan-500 shadow-sm shadow-cyan-400 dark:bg-cyan-400" />
            <Text
              numberOfLines={1}
              className="flex-1 text-[10px] font-extrabold tracking-wider text-cyan-800 uppercase dark:text-cyan-300"
            >
              FIBRA ÓPTICA PURA · FTTH DIRECTA
            </Text>
          </View>

          <Pressable
            onPress={handleRefresh}
            accessibilityRole="button"
            accessibilityLabel="Actualizar estado de conexión"
            className="shrink-0 flex-row items-center gap-1.5 rounded-full border border-border/80 bg-card/80 px-2.5 py-1.5"
          >
            <Icon as={RefreshCw} size={12} className="text-muted-foreground" />
            <Text className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              Actualizar
            </Text>
          </Pressable>
        </View>

        {/* Barra de acento degradado carmesí a azul cobalto (firma visual Star Conectados) */}
        <View className="h-1 w-full overflow-hidden rounded-full bg-muted/40">
          <View className="h-full w-full flex-row">
            <View className="h-full flex-1 bg-destructive" />
            <View className="h-full flex-1 bg-primary" />
            <View className="h-full flex-1 bg-cyan-400" />
          </View>
        </View>

        {/* Identidad del abonado */}
        <View className="gap-1.5 pt-1">
          <View className="flex-row items-center justify-between">
            <Text variant="muted" className="text-xs font-bold tracking-widest uppercase">
              INNOVER FLOW · PORTAL DE CLIENTES
            </Text>
            <Badge variant="outline" className="border-border/70 py-0.5">
              <Text className="text-[10px] font-semibold text-muted-foreground">
                {subscriberCedula}
              </Text>
            </Badge>
          </View>
          <Text className="text-2xl font-black tracking-tight text-foreground">
            Hola, {subscriberName}
          </Text>
          <View className="flex-row items-center gap-2">
            <Text variant="muted" className="text-xs">
              Contrato: {contractNumber} · {zoneName}
            </Text>
          </View>
        </View>
      </View>

      <ScreenState
        isLoading={quoteQuery.isPending}
        errorMessage={
          quoteQuery.isError ? "No se pudo cargar tu estado de cuenta." : null
        }
        onRetry={handleRefresh}
      >
        {quote ? (
          <View className="gap-5">
            {/* 2. Chips de Telemetría de Red de Star Conectados */}
            <View className="flex-row gap-2.5">
              <View className="flex-1 rounded-2xl border border-border/80 bg-card/80 p-3 shadow-md shadow-black/10">
                <View className="flex-row items-center gap-1.5">
                  <Icon as={Zap} size={14} className="text-primary" />
                  <Text className="text-[9px] font-extrabold text-muted-foreground uppercase">
                    Latencia Red
                  </Text>
                </View>
                <Text className="mt-1 text-base font-black text-foreground">
                  &lt;14 ms
                </Text>
                <Text className="text-[9px] text-muted-foreground">Ping ultra bajo</Text>
              </View>

              <View className="flex-1 rounded-2xl border border-border/80 bg-card/80 p-3 shadow-md shadow-black/10">
                <View className="flex-row items-center gap-1.5">
                  <Icon as={Activity} size={14} className="text-cyan-600 dark:text-cyan-400" />
                  <Text className="text-[9px] font-extrabold text-muted-foreground uppercase">
                    Tecnología
                  </Text>
                </View>
                <Text className="mt-1 text-base font-black text-foreground">
                  100% FTTH
                </Text>
                <Text className="text-[9px] text-muted-foreground">Simetría 1:1</Text>
              </View>

              <View className="flex-1 rounded-2xl border border-border/80 bg-card/80 p-3 shadow-md shadow-black/10">
                <View className="flex-row items-center gap-1.5">
                  <Icon as={ShieldCheck} size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <Text className="text-[9px] font-extrabold text-muted-foreground uppercase">
                    Disponibilidad
                  </Text>
                </View>
                <Text className="mt-1 text-base font-black text-foreground">
                  99.9%
                </Text>
                <Text className="text-[9px] text-muted-foreground">Uptime real</Text>
              </View>
            </View>

            {/* Selector de simulación interactiva de los 3 estados requeridos */}
            <View className="rounded-2xl border border-border/70 bg-card/70 p-3 gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                  Simulación de Estado de Internet:
                </Text>
                <Text className="text-[10px] text-muted-foreground">
                  Toca para previsualizar
                </Text>
              </View>

              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => setSelectedState("active")}
                  accessibilityRole="button"
                  accessibilityLabel="Ver estado Activo"
                  className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border py-2 ${
                    selectedState === "active"
                      ? "border-emerald-500/80 bg-emerald-500/20"
                      : "border-border/60 bg-muted/20"
                  }`}
                >
                  <View className="size-2 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-sm shadow-emerald-400" />
                  <Text
                    className={`text-xs font-bold ${
                      selectedState === "active"
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-muted-foreground"
                    }`}
                  >
                    Activo
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setSelectedState("issue")}
                  accessibilityRole="button"
                  accessibilityLabel="Ver estado Con falla"
                  className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border py-2 ${
                    selectedState === "issue"
                      ? "border-amber-500/80 bg-amber-500/20"
                      : "border-border/60 bg-muted/20"
                  }`}
                >
                  <View className="size-2 rounded-full bg-amber-500 dark:bg-amber-400 shadow-sm shadow-amber-400" />
                  <Text
                    className={`text-xs font-bold ${
                      selectedState === "issue"
                        ? "text-amber-700 dark:text-amber-300"
                        : "text-muted-foreground"
                    }`}
                  >
                    Con falla
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setSelectedState("cut")}
                  accessibilityRole="button"
                  accessibilityLabel="Ver estado Cortado"
                  className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border py-2 ${
                    selectedState === "cut"
                      ? "border-destructive/80 bg-destructive/20"
                      : "border-border/60 bg-muted/20"
                  }`}
                >
                  <View className="size-2 rounded-full bg-destructive shadow-sm shadow-destructive" />
                  <Text
                    className={`text-xs font-bold ${
                      selectedState === "cut"
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    Cortado
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* 3. TARJETA DE ESTADO DEL INTERNET (ACTIVO / CON FALLA / CORTADO) */}
            <Card
              className={`overflow-hidden border-2 shadow-xl shadow-black/20 ${
                selectedState === "cut"
                  ? "border-destructive/70 bg-card"
                  : selectedState === "issue"
                    ? "border-amber-500/60 bg-card"
                    : "border-emerald-500/50 bg-card"
              }`}
            >
              {/* Franja luminosa superior */}
              <View
                className={`h-1.5 w-full ${
                  selectedState === "cut"
                    ? "bg-destructive"
                    : selectedState === "issue"
                      ? "bg-amber-500 dark:bg-amber-400"
                      : "bg-emerald-500 dark:bg-emerald-400"
                }`}
              />

              <CardHeader className="gap-2">
                {/* Header con flex-1 y shrink-0 para evitar cortes de texto */}
                <View className="flex-row items-center justify-between gap-2">
                  <View className="flex-1 flex-row items-center gap-2">
                    <Icon
                      as={
                        selectedState === "cut"
                          ? WifiOff
                          : selectedState === "issue"
                            ? AlertTriangle
                            : Wifi
                      }
                      size={18}
                      className={
                        selectedState === "cut"
                          ? "text-destructive"
                          : selectedState === "issue"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-emerald-600 dark:text-emerald-400"
                      }
                    />
                    <CardTitle
                      className="text-sm font-black tracking-tight"
                      numberOfLines={1}
                    >
                      Estado de tu Conexión
                    </CardTitle>
                  </View>

                  {/* Badge de estado conciso que nunca se trunca */}
                  {selectedState === "cut" ? (
                    <Badge variant="destructive" className="shrink-0 px-2.5 py-0.5">
                      <Text className="text-[11px] font-bold">Cortado</Text>
                    </Badge>
                  ) : selectedState === "issue" ? (
                    <View className="shrink-0 flex-row items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 dark:bg-amber-500/20">
                      <View className="size-1.5 rounded-full bg-amber-500" />
                      <Text className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                        Con falla
                      </Text>
                    </View>
                  ) : (
                    <View className="shrink-0 flex-row items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 dark:bg-emerald-500/20">
                      <View className="size-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" />
                      <Text className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                        Activo
                      </Text>
                    </View>
                  )}
                </View>

                {/* Título de impacto según el estado */}
                <Text
                  className={`text-xl font-extrabold tracking-tight ${
                    selectedState === "cut"
                      ? "text-destructive"
                      : selectedState === "issue"
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-foreground"
                  }`}
                >
                  {selectedState === "cut"
                    ? "Servicio Temporalmente Suspendido"
                    : selectedState === "issue"
                      ? "Incidencia Técnica en tu Zona"
                      : "Fibra Óptica Activa y Estable"}
                </Text>

                <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                  {selectedState === "cut"
                    ? "Tu servicio de internet se encuentra pausado temporalmente por factura vencida. Al reportar y confirmar tu comprobante de pago, la reconexión se realiza de manera inmediata."
                    : selectedState === "issue"
                      ? "Hemos registrado un reporte técnico en tu sector en Valencia. Nuestro equipo técnico especializado ya se encuentra gestionándolo en la caja NAP."
                      : "Tu conexión de fibra óptica simétrica FTTH está transmitiendo a máxima velocidad sin pérdidas de paquetes. Todo tu hogar u oficina cuenta con navegación ilimitada."}
                </CardDescription>
              </CardHeader>

              <CardContent className="gap-3 pt-0">
                {/* 1. Estado CORTADO */}
                {selectedState === "cut" ? (
                  <View className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 gap-2">
                    <View className="flex-row items-center gap-1.5">
                      <Icon as={AlertCircle} size={15} className="text-destructive" />
                      <Text className="text-xs font-bold text-destructive">
                        Acción requerida para reconexión inmediata:
                      </Text>
                    </View>
                    <Text className="text-xs text-muted-foreground leading-relaxed">
                      Saldo pendiente: {quote.debtUsdFormatted} ({quote.debtBsFormatted ?? "en Bs según BCV"}).
                      Al reportar tu pago móvil o transferencia, el sistema procesa el desbloqueo.
                    </Text>
                    <Button
                      className="mt-1 min-h-12 h-12 w-full flex-row items-center justify-center gap-2 rounded-xl bg-destructive active:opacity-90 shadow-md shadow-destructive/30"
                      onPress={() => navigation.navigate("Facturación")}
                      accessibilityLabel="Reportar pago para reconectar"
                    >
                      <Icon as={CreditCard} size={16} className="text-destructive-foreground" />
                      <Text className="text-xs font-bold text-destructive-foreground uppercase tracking-wider">
                        Reportar pago para reconectar
                      </Text>
                      <Icon as={ArrowRight} size={15} className="text-destructive-foreground" />
                    </Button>
                  </View>
                ) : selectedState === "issue" ? (
                  /* 2. Estado CON FALLA */
                  <View className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 gap-2.5 dark:bg-amber-950/20">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-1.5">
                        <Icon as={Ticket} size={15} className="text-amber-600 dark:text-amber-400" />
                        <Text className="text-xs font-bold text-amber-700 dark:text-amber-300">
                          Caso #{openTicket.wisproPublicId ?? 4082}
                        </Text>
                      </View>
                      <Badge variant="outline" className="border-amber-500/40">
                        <Text className="text-[10px] text-amber-700 dark:text-amber-300">
                          {ticketStatusLabel(openTicket.status)}
                        </Text>
                      </Badge>
                    </View>

                    <Text className="text-xs font-semibold text-foreground">
                      {openTicket.title}
                    </Text>

                    <View className="gap-1 border-t border-amber-500/20 pt-2">
                      <View className="flex-row items-center gap-1.5">
                        <Icon as={UserCheck} size={12} className="text-amber-600 dark:text-amber-400" />
                        <Text className="text-[11px] text-muted-foreground">
                          Técnico asignado: <Text className="font-bold text-foreground">{openTicket.employeeName ?? "Jesús Rojas"}</Text>
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-1.5">
                        <Icon as={Clock} size={12} className="text-amber-600 dark:text-amber-400" />
                        <Text className="text-[11px] text-muted-foreground">
                          Ventana de visita: <Text className="font-bold text-foreground">Hoy 9:00 AM - 12:00 PM</Text>
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-1.5">
                        <Icon as={MapPin} size={12} className="text-amber-600 dark:text-amber-400" />
                        <Text className="text-[11px] text-muted-foreground">
                          Sector: <Text className="font-bold text-foreground">{openTicket.addressText ?? "Valencia · El Parral"}</Text>
                        </Text>
                      </View>
                    </View>

                    <Button
                      variant="outline"
                      className="mt-1 min-h-11 h-11 w-full flex-row items-center justify-center gap-2 rounded-xl border-amber-500/40 bg-amber-500/10 active:opacity-90 dark:bg-amber-950/30"
                      onPress={() => navigation.navigate("Mi ticket")}
                      accessibilityLabel="Ver seguimiento del ticket"
                    >
                      <Icon as={Ticket} size={15} className="text-amber-700 dark:text-amber-300" />
                      <Text className="text-xs font-bold text-amber-700 dark:text-amber-300">
                        Ver seguimiento de mi ticket
                      </Text>
                      <Icon as={ArrowRight} size={15} className="text-amber-700 dark:text-amber-300" />
                    </Button>
                  </View>
                ) : (
                  /* 3. Estado ACTIVO (Layout corregido: sin colisión ni saltos raros) */
                  <View className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 gap-2.5 dark:bg-emerald-950/20">
                    <View className="flex-row flex-wrap items-center gap-2">
                      <View className="flex-row items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1">
                        <Icon as={CheckCircle2} size={13} className="text-emerald-600 dark:text-emerald-400" />
                        <Text className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                          Simetría 1:1 Activa
                        </Text>
                      </View>

                      <View className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1">
                        <Text className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                          0% Pérdida de paquetes
                        </Text>
                      </View>
                    </View>

                    <Text className="text-[11px] leading-relaxed text-muted-foreground">
                      Enrutamiento directo y optimizado a servidores de baja latencia para gaming competitivo, streaming 4K HDR y videollamadas sin cortes.
                    </Text>

                    {/* Telemetría local con columnas limpias (etiqueta arriba, valor abajo) */}
                    <View className="flex-row items-center justify-between border-t border-emerald-500/20 pt-2.5">
                      <View className="gap-0.5">
                        <Text className="text-[10px] font-semibold text-muted-foreground uppercase">
                          Dispositivos activos
                        </Text>
                        <Text className="text-xs font-black text-foreground">
                          8 equipos en línea
                        </Text>
                      </View>

                      <View className="items-end gap-0.5">
                        <Text className="text-[10px] font-semibold text-muted-foreground uppercase">
                          Dirección IP ONT
                        </Text>
                        <Text className="text-xs font-black text-foreground">
                          190.202.88.45
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </CardContent>
            </Card>

            {/* 4. SALDO PENDIENTE & FACTURACIÓN (Inversión mensual Star Conectados) */}
            <Card className="border-border/80 bg-card/90 shadow-xl shadow-black/15">
              <CardHeader className="gap-1.5">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Icon as={CreditCard} size={18} className="text-primary" />
                    <CardTitle className="text-base font-bold">
                      Saldo y Facturación
                    </CardTitle>
                  </View>
                  <AccountStatusBadge status={quote.accountStatus} />
                </View>
                <CardDescription className="text-xs">
                  Inversión mensual de tu servicio de fibra óptica
                </CardDescription>
              </CardHeader>

              <CardContent className="gap-3">
                <View className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <Text className="text-xs font-semibold text-muted-foreground uppercase">
                    Saldo pendiente total:
                  </Text>
                  <Text className="mt-1 text-3xl font-black tracking-tight text-foreground">
                    {quote.debtUsdFormatted}
                  </Text>
                  {quote.debtBsFormatted ? (
                    <Text className="text-sm font-bold text-muted-foreground">
                      {quote.debtBsFormatted}
                    </Text>
                  ) : null}
                  {quote.bcvRateDisplay ? (
                    <View className="mt-2 flex-row items-center gap-1 rounded-lg border border-border/50 bg-background/50 px-2.5 py-1">
                      <Text className="text-[11px] text-muted-foreground">
                        Tasa oficial BCV:
                      </Text>
                      <Text className="text-[11px] font-bold text-foreground">
                        {quote.bcvRateDisplay}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Alerta de oficina cerrada */}
                {quote.officeClosed ? (
                  <Alert icon={Info}>
                    <AlertTitle>Oficina fuera de horario</AlertTitle>
                    <AlertDescription>
                      Puedes registrar tu pago las 24 horas. La validación humana se realiza en horario de oficina
                      {quote.nextOpenLabel
                        ? ` (próxima apertura: ${quote.nextOpenLabel})`
                        : "."}
                    </AlertDescription>
                  </Alert>
                ) : null}

                {/* Botones de acción rápida de facturación */}
                <View className="gap-2 pt-1">
                  <Button
                    className="min-h-12 h-12 w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary shadow-lg shadow-primary/30 active:opacity-90"
                    onPress={() => navigation.navigate("Facturación")}
                    accessibilityLabel="Pagar servicio o enviar comprobante"
                  >
                    <Icon as={CreditCard} size={16} className="text-primary-foreground" />
                    <Text className="text-xs font-bold text-primary-foreground uppercase tracking-wider">
                      Pagar servicio / Enviar comprobante
                    </Text>
                    <Icon as={ArrowRight} size={16} className="text-primary-foreground" />
                  </Button>

                  <Button
                    variant="outline"
                    className="min-h-11 h-11 w-full flex-row items-center justify-center gap-2 rounded-xl border-border/80 active:opacity-90"
                    onPress={() =>
                      navigation.navigate("Chat", { intent: "report-outage" })
                    }
                    accessibilityLabel="Reportar falla técnica"
                  >
                    <Icon as={AlertTriangle} size={15} className="text-muted-foreground" />
                    <Text className="text-xs font-semibold text-foreground">
                      Reportar falla técnica
                    </Text>
                  </Button>
                </View>
              </CardContent>
            </Card>

            {/* 5. PLAN CONTRATADO (Inspirado en la Tarjeta de Planes de Star Conectados) */}
            <Card className="overflow-hidden border-border/80 bg-card/95 shadow-xl shadow-black/15">
              {/* Franja de destaque cósmico */}
              <View className="h-1 w-full bg-primary" />

              <CardHeader className="gap-2">
                <View className="flex-row items-center justify-between">
                  <View className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1">
                    <Text className="text-[10px] font-black tracking-wider text-primary uppercase">
                      PLAN CONTRATADO
                    </Text>
                  </View>
                  <Text className="text-[10px] font-bold text-muted-foreground uppercase">
                    FTTH Residencial
                  </Text>
                </View>

                <CardTitle className="text-xl font-black tracking-tight text-foreground">
                  Plan Hogar Pro · 200 Mbps
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Conexión ultra rápida y simétrica con tecnología FTTH directa para tu inmueble.
                </CardDescription>
              </CardHeader>

              <CardContent className="gap-4">
                {/* Bloque de velocidad con badge de alta legibilidad */}
                <View className="rounded-2xl border border-border/80 bg-muted/20 p-4">
                  <View className="flex-row items-center justify-between gap-2">
                    <View className="flex-row items-baseline gap-1.5">
                      <Text className="text-3xl font-black tracking-tighter text-foreground">
                        200
                      </Text>
                      <Text className="text-lg font-black text-primary">
                        Mbps
                      </Text>
                    </View>

                    <View className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 dark:border-cyan-500/40 dark:bg-cyan-950/40">
                      <Text className="text-[10px] font-extrabold text-primary dark:text-cyan-300">
                        Velocidad Simétrica 1:1
                      </Text>
                    </View>
                  </View>
                  <Text className="mt-1 text-[11px] text-muted-foreground">
                    Misma velocidad para descarga y subida de archivos de gran tamaño.
                  </Text>

                  {/* Equipamiento y nodo con layout seguro: sin superposición de textos */}
                  <View className="mt-3 gap-2 border-t border-border/50 pt-3">
                    <View className="flex-row items-start justify-between gap-3">
                      <Text className="shrink-0 text-[11px] font-semibold text-muted-foreground">
                        Equipamiento:
                      </Text>
                      <Text className="flex-1 text-right text-[11px] font-bold text-foreground">
                        Router Wi-Fi 6 Gigabit de Alta Cobertura
                      </Text>
                    </View>

                    <View className="flex-row items-start justify-between gap-3">
                      <Text className="shrink-0 text-[11px] font-semibold text-muted-foreground">
                        Sector / Nodo:
                      </Text>
                      <Text className="flex-1 text-right text-[11px] font-bold text-foreground">
                        {zoneName}
                      </Text>
                    </View>

                    <View className="flex-row items-start justify-between gap-3">
                      <Text className="shrink-0 text-[11px] font-semibold text-muted-foreground">
                        Dirección IP Asignada:
                      </Text>
                      <Text className="flex-1 text-right text-[11px] font-bold text-foreground">
                        190.202.88.45 (DHCP ONT)
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Lista de beneficios incluidos con checks de alto contraste */}
                <View className="gap-2">
                  <Text className="text-xs font-extrabold tracking-wider text-muted-foreground uppercase">
                    Incluido en tu servicio:
                  </Text>
                  {[
                    "Velocidad simétrica real sin límites de descarga ni consumo",
                    "Latencia ultra baja (<14ms) para streaming 4K y gaming competitivo",
                    "Streaming simultáneo en múltiples pantallas en 4K UHD sin pausas",
                    "Router Wi-Fi 6 de última generación con doble banda Gigabit",
                    "Instalación certificada con fibra drop de alta resistencia climática",
                    "Soporte técnico directo y monitoreo continuo 24/7",
                  ].map((benefit, index) => (
                    <View key={index} className="flex-row items-start gap-2.5">
                      <View className="mt-0.5 size-4 items-center justify-center rounded-full bg-emerald-500/20">
                        <Icon as={Check} size={11} className="text-emerald-600 dark:text-emerald-400" />
                      </View>
                      <Text className="flex-1 text-xs leading-relaxed text-foreground">
                        {benefit}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Botón para ver contrato */}
                <Button
                  variant="outline"
                  className="min-h-11 h-11 w-full flex-row items-center justify-center gap-2 rounded-xl border-border/80 active:opacity-90"
                  onPress={() => navigation.navigate("Contrato")}
                  accessibilityLabel="Ver contrato y especificaciones técnicas"
                >
                  <Icon as={FileText} size={15} className="text-muted-foreground" />
                  <Text className="text-xs font-semibold text-foreground">
                    Ver contrato y especificaciones
                  </Text>
                  <Icon as={ArrowRight} size={14} className="text-muted-foreground" />
                </Button>
              </CardContent>
            </Card>

            {/* 6. Casos de uso optimizados (Star Conectados: "¿Qué quieres hacer hoy?") */}
            <View className="gap-2.5">
              <Text className="text-xs font-extrabold tracking-wider text-muted-foreground uppercase">
                Red Optimizada para tu Día a Día
              </Text>
              <View className="flex-row gap-2.5">
                <View className="flex-1 rounded-xl border border-border/70 bg-card/60 p-3">
                  <Text className="text-xs font-extrabold text-foreground">
                    Gaming Competitivo
                  </Text>
                  <Text className="mt-0.5 text-[10px] text-muted-foreground">
                    Ping &lt;15ms · 0% Packet Loss
                  </Text>
                </View>

                <View className="flex-1 rounded-xl border border-border/70 bg-card/60 p-3">
                  <Text className="text-xs font-extrabold text-foreground">
                    Streaming 4K UHD
                  </Text>
                  <Text className="mt-0.5 text-[10px] text-muted-foreground">
                    0 seg de buffering sin pausas
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-2.5">
                <View className="flex-1 rounded-xl border border-border/70 bg-card/60 p-3">
                  <Text className="text-xs font-extrabold text-foreground">
                    Home Office & Nube
                  </Text>
                  <Text className="mt-0.5 text-[10px] text-muted-foreground">
                    100% Subida simétrica para videollamadas
                  </Text>
                </View>

                <View className="flex-1 rounded-xl border border-border/70 bg-card/60 p-3">
                  <Text className="text-xs font-extrabold text-foreground">
                    Hogar Inteligente
                  </Text>
                  <Text className="mt-0.5 text-[10px] text-muted-foreground">
                    30+ dispositivos en simultáneo
                  </Text>
                </View>
              </View>
            </View>

            {/* 7. Footer de marca sutil */}
            <View className="items-center gap-1 py-4">
              <Text className="text-[11px] font-bold text-muted-foreground">
                Conexiones Innover C.A. · Red de Fibra Óptica FTTH
              </Text>
              <Text className="text-[10px] text-muted-foreground/70">
                Tu conexión sin límites. Estabilidad garantizada por fibra directa.
              </Text>
            </View>
          </View>
        ) : null}
      </ScreenState>
    </ScrollView>
  );
};
