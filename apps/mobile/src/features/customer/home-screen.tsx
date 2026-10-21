import type {
  CustomerStackParamList,
  CustomerTabParamList,
} from "@/app/navigation-types";
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
import { InnoverIcon } from "@/components/brand-logo";
import { ScreenState } from "@/components/screen-state";
import { useAuthSession } from "@/features/auth/auth-session";
import { AccountStatusBadge } from "@/features/customer/account-status-badge";
import { fetchAccountQuote } from "@/features/customer/account-quote-gateway";
import { fetchHomeFaqPreview } from "@/features/customer/faq-gateway";
import {
  chromeForSeverity,
  resolveHomeLinkState,
  SIMULATOR_LABEL,
} from "@/features/customer/service-notice-appearance";
import {
  SERVICE_NOTICE_KINDS,
} from "@/features/customer/service-notice-gateway";
import {
  canPresentLocalServiceNotice,
  presentLocalServiceNotice,
} from "@/features/customer/local-service-notification";
import { ServiceNoticeRow } from "@/features/customer/service-notice-row";
import type { UserNotice } from "@/lib/user-notice";
import {
  selectActiveNotice,
  useServiceNoticeStore,
} from "@/features/customer/service-notice-store";
import { customerOpenTicketQueryKey } from "@/features/chat/chat-cache";
import { fetchCustomerOpenTicket } from "@/features/customer/ticket-gateway";
import { noticeFromUnknown } from "@/lib/user-notice";
import { cn } from "@/lib/utils";
import { displayTicketStatus } from "@/features/customer/ticket-status-badge";
import { formatTicketWindowBreakdown } from "@/features/customer/format-window";
import {
  useNavigation,
  type CompositeNavigationProp,
} from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  Headphones,
  HelpCircle,
  Info,
  Bell,
  MapPin,
  RefreshCw,
  Ticket,
} from "lucide-react-native";
import * as React from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";

export const CustomerHomeScreen = () => {
  const { profile } = useAuthSession();
  const navigation =
    useNavigation<
      CompositeNavigationProp<
        BottomTabNavigationProp<CustomerTabParamList>,
        NativeStackNavigationProp<CustomerStackParamList>
      >
    >();

  const simulateNotice = useServiceNoticeStore((state) => state.simulate);
  const activeNotice = useServiceNoticeStore(selectActiveNotice);
  const [deviceNotice, setDeviceNotice] = React.useState<UserNotice | null>(
    null,
  );
  const [isSendingDeviceNotice, setIsSendingDeviceNotice] =
    React.useState(false);

  const quoteQuery = useQuery({
    queryKey: ["account-quote"],
    queryFn: fetchAccountQuote,
  });

  const ticketQuery = useQuery({
    queryKey: customerOpenTicketQueryKey(profile?.userId),
    queryFn: fetchCustomerOpenTicket,
    enabled: Boolean(profile),
  });

  const faqQuery = useQuery({
    queryKey: ["customer-faq-preview"],
    queryFn: fetchHomeFaqPreview,
  });

  const isRefreshing = quoteQuery.isRefetching || ticketQuery.isRefetching;

  const handleRefresh = () => {
    void quoteQuery.refetch();
    void ticketQuery.refetch();
  };

  const handleNoticeCta = (action: "chat" | "ticket" | "chat-confirm") => {
    if (action === "ticket") {
      navigation.navigate("Mi ticket");
      return;
    }
    if (action === "chat-confirm") {
      navigation.navigate("Chat", { intent: "confirm-connection" });
      return;
    }
    navigation.navigate("Chat");
  };

  const handleSendToPhone = async () => {
    if (!activeNotice || isSendingDeviceNotice) {
      return;
    }
    setDeviceNotice(null);
    setIsSendingDeviceNotice(true);
    const result = await presentLocalServiceNotice(activeNotice);
    setIsSendingDeviceNotice(false);
    if (!result.ok) {
      setDeviceNotice(result.notice);
    }
  };

  const quote = quoteQuery.data;
  const openTicket = ticketQuery.data ?? null;
  const openTicketWindow = openTicket
    ? formatTicketWindowBreakdown(openTicket.windowStart, openTicket.windowEnd)
    : null;
  const linkState = resolveHomeLinkState(
    activeNotice?.kind,
    Boolean(quote?.serviceSuspended),
  );
  const linkChrome =
    linkState === "fiber_cut" || linkState === "billing_cut"
      ? chromeForSeverity("critical")
      : linkState === "power_warning"
        ? chromeForSeverity("warning")
        : linkState === "zone_work"
          ? chromeForSeverity("info")
          : linkState === "restored"
            ? chromeForSeverity("success")
            : { ...chromeForSeverity("success"), label: "Activo" };

  // Datos mockeados de identidad de abonado
  const subscriberName =
    profile?.displayName &&
    profile.displayName !== "Abonado" &&
    profile.displayName !== "Cliente"
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
      }>
      {/* 1. Header Hero Oficial Conexiones Innover Flow */}
      <View className="overflow-hidden rounded-3xl border border-border/80 bg-card/95 shadow-xl shadow-black/10">
        {/* Franja de Acento Tricolor Oficial (Carmesí Innover -> Azul Cobalto -> Cian FTTH) */}
        <View className="h-1.5 w-full flex-row">
          <View className="h-full flex-1 bg-destructive" />
          <View className="h-full flex-1 bg-primary" />
          <View className="h-full flex-1 bg-cyan-400" />
        </View>

        <View className="p-4 gap-3.5">
          {/* Fila Superior: Pill de Conexión + Cédula + Botón Actualizar */}
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-row items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 dark:bg-cyan-950/40">
              <View className="size-2 rounded-full bg-cyan-500 shadow-sm shadow-cyan-400 dark:bg-cyan-400" />
              <Text className="text-[10px] font-extrabold tracking-wider text-cyan-800 uppercase dark:text-cyan-300">
                FIBRA ÓPTICA FTTH DIRECTA
              </Text>
            </View>

            <View className="flex-row items-center gap-1.5">
              <Badge
                variant="outline"
                className="border-border/70 bg-muted/30 px-2.5 py-1">
                <Text className="text-[10px] font-bold text-muted-foreground">
                  {subscriberCedula}
                </Text>
              </Badge>

              <Pressable
                onPress={handleRefresh}
                accessibilityRole="button"
                accessibilityLabel="Actualizar estado de conexión"
                hitSlop={8}
                className="size-8 items-center justify-center rounded-full border border-border/80 bg-card active:bg-muted">
                <Icon
                  as={RefreshCw}
                  size={13}
                  className={
                    isRefreshing ? "text-primary" : "text-muted-foreground"
                  }
                />
              </Pressable>
            </View>
          </View>

          {/* Bloque de Identidad y Saludo */}
          <View className="gap-1">
            <View className="flex-row items-center gap-1.5">
              <View className="size-1.5 rounded-full bg-destructive" />
              <Text className="text-[10px] font-extrabold tracking-widest text-primary uppercase">
                INNOVER · PORTAL DE CLIENTES
              </Text>
            </View>

            <Text className="text-2xl font-black tracking-tight text-foreground">
              Hola, {subscriberName}
            </Text>

            <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1 pt-0.5">
              <View className="flex-row items-center gap-1">
                <Icon
                  as={CheckCircle2}
                  size={12}
                  className="text-emerald-500"
                />
                <Text className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Conexión Activa
                </Text>
              </View>
              <Text className="text-xs text-muted-foreground/60">•</Text>
              <Text className="text-xs text-muted-foreground">
                Contrato {contractNumber}
              </Text>
              <Text className="text-xs text-muted-foreground/60">•</Text>
              <View className="flex-row items-center gap-1">
                <Icon as={MapPin} size={11} className="text-muted-foreground" />
                <Text
                  className="text-xs text-muted-foreground"
                  numberOfLines={1}>
                  {zoneName}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScreenState
        isLoading={quoteQuery.isPending}
        errorNotice={
          quoteQuery.isError
            ? noticeFromUnknown(
                quoteQuery.error,
                "No se pudo cargar tu cuenta",
              )
            : null
        }
        onRetry={handleRefresh}>
        {quote ? (
          <View className="gap-5">
            {__DEV__ ? (
              <View className="rounded-2xl border border-border/70 bg-card/70 p-3 gap-2">
                <Text className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                  Simular aviso de red (solo desarrollo)
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {SERVICE_NOTICE_KINDS.map((kind) => {
                    const chrome = chromeForSeverity(
                      kind === "fiber_cut"
                        ? "critical"
                        : kind === "power_warning"
                          ? "warning"
                          : kind === "zone_work"
                            ? "info"
                            : "success",
                    );
                    const selected = activeNotice?.kind === kind;
                    return (
                      <Pressable
                        key={kind}
                        onPress={() => {
                          setDeviceNotice(null);
                          simulateNotice(kind);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Simular ${SIMULATOR_LABEL[kind]}`}
                        className={cn(
                          "min-h-11 min-w-[46%] flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border px-2 py-2",
                          selected ? chrome.card : "border-border/60 bg-muted/20",
                        )}
                      >
                        <View className={cn("size-2 rounded-full", chrome.badge)} />
                        <Text
                          className={cn(
                            "text-xs font-bold",
                            selected ? chrome.title : "text-muted-foreground",
                          )}
                        >
                          {SIMULATOR_LABEL[kind]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Button
                  className="mt-1 h-11 min-h-11 w-full flex-row items-center justify-center gap-2 rounded-xl"
                  disabled={!activeNotice || isSendingDeviceNotice}
                  onPress={() => {
                    void handleSendToPhone();
                  }}
                  accessibilityLabel="Mostrar este aviso en las notificaciones del teléfono"
                >
                  <Icon as={Bell} size={16} className="text-primary-foreground" />
                  <Text className="text-xs font-bold text-primary-foreground">
                    {isSendingDeviceNotice
                      ? "Enviando al teléfono…"
                      : "Mostrar en el teléfono"}
                  </Text>
                </Button>
                {deviceNotice ? (
                  <Text className="text-[11px] leading-relaxed text-destructive">
                    {deviceNotice.title}. {deviceNotice.description}
                  </Text>
                ) : (
                  <Text className="text-[11px] leading-relaxed text-muted-foreground">
                    {canPresentLocalServiceNotice()
                      ? "Elige un aviso y tócalo para verlo en la bandeja de notificaciones del teléfono."
                      : "La bandeja del teléfono no está disponible en Expo Go ni en el navegador. Ábrela en un development build."}
                  </Text>
                )}
              </View>
            ) : null}

            {activeNotice ? <ServiceNoticeRow notice={activeNotice} /> : null}

            <Card
              className={cn(
                "overflow-hidden border-2 bg-card shadow-xl shadow-black/20",
                linkState === "fiber_cut" || linkState === "billing_cut"
                  ? "border-destructive/70"
                  : linkState === "power_warning"
                    ? "border-amber-500/60"
                    : linkState === "zone_work"
                      ? "border-primary/50"
                      : "border-emerald-500/50",
              )}>
              <View className={cn("h-1.5 w-full", linkChrome.badge)} />

              <CardHeader className="gap-2">
                <View className="flex-row items-center justify-between gap-2">
                  <View className="flex-1 flex-row items-center gap-2">
                    <InnoverIcon size={18} tone={linkChrome.tone} />
                    <CardTitle
                      className="text-sm font-black tracking-tight"
                      numberOfLines={1}>
                      Estado de tu Conexión
                    </CardTitle>
                  </View>
                  <View
                    className={cn(
                      "shrink-0 flex-row items-center gap-1.5 rounded-full border px-2.5 py-0.5",
                      linkChrome.card,
                    )}>
                    <View className={cn("size-1.5 rounded-full", linkChrome.badge)} />
                    <Text className={cn("text-[11px] font-bold", linkChrome.title)}>
                      {linkChrome.label}
                    </Text>
                  </View>
                </View>

                <Text
                  className={cn(
                    "text-xl font-extrabold tracking-tight",
                    linkChrome.title,
                  )}>
                  {activeNotice?.title ??
                    (linkState === "billing_cut"
                      ? "Servicio temporalmente suspendido"
                      : "Fibra óptica activa y estable")}
                </Text>

                <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                  {activeNotice?.body ??
                    (linkState === "billing_cut"
                      ? "Tu servicio está pausado por factura vencida. Al reportar el comprobante, la reconexión queda en revisión."
                      : "Tu conexión de fibra óptica FTTH está transmitiendo sin pérdidas de paquetes.")}
                </CardDescription>
              </CardHeader>

              <CardContent className="gap-3 pt-0">
                {linkState === "billing_cut" ? (
                  <View className="gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5">
                    <Text className="text-xs font-bold text-destructive">
                      Acción requerida para reconexión
                    </Text>
                    <Text className="text-xs leading-relaxed text-muted-foreground">
                      Saldo pendiente: {quote.debtUsdFormatted} (
                      {quote.debtBsFormatted ?? "en Bs según BCV"}).
                    </Text>
                    <Button
                      className="mt-1 h-12 min-h-12 w-full flex-row items-center justify-center gap-2 rounded-xl bg-destructive"
                      onPress={() => navigation.navigate("Facturación")}
                      accessibilityLabel="Reportar pago para reconectar">
                      <Icon
                        as={CreditCard}
                        size={16}
                        className="text-destructive-foreground"
                      />
                      <Text className="text-xs font-bold uppercase tracking-wider text-destructive-foreground">
                        Reportar pago para reconectar
                      </Text>
                    </Button>
                  </View>
                ) : null}

                {linkState === "fiber_cut" ||
                linkState === "power_warning" ||
                linkState === "zone_work" ||
                linkState === "restored" ? (
                  <View className={cn("gap-2.5 rounded-xl border p-3.5", linkChrome.card)}>
                    {linkState === "power_warning" && openTicket ? (
                      <Text className={cn("text-xs font-bold", linkChrome.title)}>
                        {openTicket.wisproPublicId != null
                          ? `Visita #${openTicket.wisproPublicId}`
                          : "Visita técnica"}{" "}
                        ·{" "}
                        {displayTicketStatus(
                          openTicket.status,
                          openTicket.statusLabel,
                        )}
                      </Text>
                    ) : null}
                    {activeNotice?.cta ? (
                      <Button
                        variant="outline"
                        className="h-11 min-h-11 w-full flex-row items-center justify-center gap-2 rounded-xl"
                        onPress={() => {
                          const cta = activeNotice.cta;
                          if (!cta) {
                            return;
                          }
                          handleNoticeCta(cta.action);
                        }}
                        accessibilityLabel={activeNotice.cta.label}>
                        <Text className={cn("text-xs font-bold", linkChrome.title)}>
                          {activeNotice.cta.label}
                        </Text>
                        <Icon
                          as={ArrowRight}
                          size={15}
                          className={linkChrome.title}
                        />
                      </Button>
                    ) : null}
                    {linkState === "power_warning" ? (
                      <Button
                        variant="outline"
                        className="h-11 min-h-11 w-full flex-row items-center justify-center gap-2 rounded-xl"
                        onPress={() => navigation.navigate("Mi ticket")}
                        accessibilityLabel="Ver seguimiento del ticket">
                        <Icon as={Ticket} size={15} className={linkChrome.title} />
                        <Text className={cn("text-xs font-bold", linkChrome.title)}>
                          Ver seguimiento de mi ticket
                        </Text>
                      </Button>
                    ) : null}
                  </View>
                ) : null}

                {linkState === "active" ? (
                  <View className="gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 dark:bg-emerald-950/20">
                    <View className="flex-row flex-wrap items-center gap-2">
                      <View className="flex-row items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1">
                        <Icon
                          as={CheckCircle2}
                          size={13}
                          className="text-emerald-600 dark:text-emerald-400"
                        />
                        <Text className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                          Simetría 1:1 activa
                        </Text>
                      </View>
                    </View>
                    <Text className="text-[11px] leading-relaxed text-muted-foreground">
                      Enrutamiento directo para navegación estable en tu hogar.
                    </Text>
                  </View>
                ) : null}
              </CardContent>
            </Card>

            {ticketQuery.isError ? (
              <Alert icon={Info}>
                <AlertTitle>No se pudo cargar tu visita</AlertTitle>
                <AlertDescription>
                  {
                    noticeFromUnknown(
                      ticketQuery.error,
                      "No se pudieron cargar tus visitas",
                    ).description
                  }
                </AlertDescription>
              </Alert>
            ) : null}

            {openTicket ? (
              <Card className="overflow-hidden border-2 border-primary/40 bg-card/95 shadow-xl shadow-black/10">
                <View className="h-1.5 w-full bg-primary" />
                <CardHeader className="gap-2">
                  <View className="flex-row items-center justify-between gap-2">
                    <View className="flex-row items-center gap-2">
                      <Icon as={Ticket} size={18} className="text-primary" />
                      <CardTitle className="text-base font-bold">
                        Visita técnica
                      </CardTitle>
                    </View>
                    <Badge variant="outline" className="border-primary/40 bg-primary/10">
                      <Text className="text-[10px] font-bold text-primary">
                        {displayTicketStatus(
                          openTicket.status,
                          openTicket.statusLabel,
                        )}
                      </Text>
                    </Badge>
                  </View>
                  <CardDescription className="text-xs">
                    {openTicket.wisproPublicId != null
                      ? `Visita #${openTicket.wisproPublicId}`
                      : "Seguimiento de tu caso de campo"}
                  </CardDescription>
                  <Text className="text-sm font-bold text-foreground">
                    {openTicket.title}
                  </Text>
                </CardHeader>
                <CardContent className="gap-3 pt-0">
                  <Text className="text-xs text-muted-foreground">
                    {openTicketWindow
                      ? `${openTicketWindow.dateLabel} · ${openTicketWindow.hoursLabel}`
                      : "Horario por confirmar cuando el CRM agende la visita."}
                  </Text>
                  {openTicket.employeeName ? (
                    <Text className="text-xs text-muted-foreground">
                      Técnico: {openTicket.employeeName}
                    </Text>
                  ) : null}
                  <Button
                    variant="outline"
                    className="h-11 min-h-11 w-full flex-row items-center justify-center gap-2 rounded-xl"
                    onPress={() => navigation.navigate("Mi ticket")}
                    accessibilityLabel="Ver seguimiento del ticket">
                    <Icon as={Ticket} size={15} className="text-primary" />
                    <Text className="text-xs font-bold text-primary">
                      Ver seguimiento
                    </Text>
                    <Icon as={ArrowRight} size={15} className="text-primary" />
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {/* 4. SALDO PENDIENTE & FACTURACIÓN (Inversión mensual Conexiones Innover) */}
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
                      Puedes registrar tu pago las 24 horas. La validación
                      humana se realiza en horario de oficina
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
                    accessibilityLabel="Pagar servicio o enviar comprobante">
                    <Icon
                      as={CreditCard}
                      size={16}
                      className="text-primary-foreground"
                    />
                    <Text className="text-xs font-bold text-primary-foreground uppercase tracking-wider">
                      Pagar servicio
                    </Text>
                    <Icon
                      as={ArrowRight}
                      size={16}
                      className="text-primary-foreground"
                    />
                  </Button>

                  <Button
                    variant="outline"
                    className="min-h-11 h-11 w-full flex-row items-center justify-center gap-2 rounded-xl border-border/80 active:opacity-90"
                    onPress={() =>
                      navigation.navigate("Chat", { intent: "report-outage" })
                    }
                    accessibilityLabel="Reportar falla técnica">
                    <Icon
                      as={AlertTriangle}
                      size={15}
                      className="text-muted-foreground"
                    />
                    <Text className="text-xs font-semibold text-foreground">
                      Reportar falla técnica
                    </Text>
                  </Button>

                  <Button
                    variant="outline"
                    className="min-h-11 h-11 w-full flex-row items-center justify-center gap-2 rounded-xl border-primary/40 bg-primary/5 active:opacity-90"
                    onPress={() => navigation.navigate("Chat")}
                    accessibilityLabel="Asesoría disponible las 24 horas"
                  >
                    <Icon as={Headphones} size={15} className="text-primary" />
                    <Text className="text-xs font-semibold text-primary">
                      Asesoría disponible 24/7
                    </Text>
                  </Button>
                  <Text className="text-center text-[10px] text-muted-foreground">
                    Nova te atiende a cualquier hora. Un asesor humano revisa en
                    horario de oficina.
                  </Text>
                </View>
              </CardContent>
            </Card>

            {/* 5. PLAN CONTRATADO (Inspirado en la Tarjeta de Planes de Conexiones Innover) */}
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
                  Conexión ultra rápida y simétrica con tecnología FTTH directa
                  para tu inmueble.
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
                    Misma velocidad para descarga y subida de archivos de gran
                    tamaño.
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
                        <Icon
                          as={Check}
                          size={11}
                          className="text-emerald-600 dark:text-emerald-400"
                        />
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
                  accessibilityLabel="Ver contrato y especificaciones técnicas">
                  <Icon
                    as={FileText}
                    size={15}
                    className="text-muted-foreground"
                  />
                  <Text className="text-xs font-semibold text-foreground">
                    Ver contrato y especificaciones
                  </Text>
                  <Icon
                    as={ArrowRight}
                    size={14}
                    className="text-muted-foreground"
                  />
                </Button>
              </CardContent>
            </Card>

            <View className="gap-2.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                  Preguntas frecuentes
                </Text>
                <Pressable
                  onPress={() => navigation.navigate("Ayuda")}
                  accessibilityRole="button"
                  accessibilityLabel="Ver todas las preguntas frecuentes"
                  className="min-h-11 flex-row items-center gap-1 px-1"
                >
                  <Text className="text-xs font-bold text-primary">
                    Ver todas
                  </Text>
                  <Icon as={ChevronRight} size={14} className="text-primary" />
                </Pressable>
              </View>

              {(faqQuery.data ?? []).map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => navigation.navigate("Ayuda", { faqId: item.id })}
                  accessibilityRole="button"
                  accessibilityLabel={item.question}
                  className="min-h-14 flex-row items-center gap-3 rounded-2xl border border-border/80 bg-card px-3.5 py-3 active:bg-muted/40"
                >
                  <View className="size-9 items-center justify-center rounded-full bg-primary/10">
                    <Icon as={HelpCircle} size={16} className="text-primary" />
                  </View>
                  <Text className="flex-1 text-sm font-semibold text-foreground">
                    {item.question}
                  </Text>
                  <Icon as={ChevronRight} size={16} className="text-muted-foreground" />
                </Pressable>
              ))}
            </View>

            <View className="items-center gap-1 py-4">
              <Text className="text-[11px] font-bold text-muted-foreground">
                Conexiones Innover C.A. · Red de Fibra Óptica FTTH
              </Text>
              <Text className="text-[10px] text-muted-foreground/70">
                Cobertura nacional. Estabilidad garantizada por fibra directa.
              </Text>
            </View>
          </View>
        ) : null}
      </ScreenState>
    </ScrollView>
  );
};
