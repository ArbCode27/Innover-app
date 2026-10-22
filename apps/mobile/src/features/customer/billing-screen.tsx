import type { BillingStackParamList } from "@/app/navigation-types";
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
import { AccountStatusBadge } from "@/features/customer/account-status-badge";
import { fetchAccountQuote } from "@/features/customer/account-quote-gateway";
import { hasPendingDebt } from "@/features/customer/payment-instructions-gateway";
import {
  fetchCustomerPayments,
  paymentRecordStatusLabel,
} from "@/features/customer/payments-gateway";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Info,
  Receipt,
} from "lucide-react-native";
import * as React from "react";
import { RefreshControl, ScrollView, View } from "react-native";

export const CustomerBillingScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<BillingStackParamList>>();
  const queryClient = useQueryClient();
  const [isPullRefreshing, setIsPullRefreshing] = React.useState(false);

  const quoteQuery = useQuery({
    queryKey: ["account-quote"],
    queryFn: () => fetchAccountQuote(),
  });

  const paymentsQuery = useQuery({
    queryKey: ["customer-payments"],
    queryFn: fetchCustomerPayments,
  });

  const quote = quoteQuery.data;
  const pending = quote ? hasPendingDebt(quote) : false;
  const debtUsdLabel = quote?.debtUsdFormatted ?? "—";

  const handlePay = () => {
    navigation.navigate("MetodoPago");
  };

  const handleRefresh = () => {
    setIsPullRefreshing(true);
    void Promise.all([
      queryClient.fetchQuery({
        queryKey: ["account-quote"],
        queryFn: () => fetchAccountQuote({ refresh: true }),
      }),
      paymentsQuery.refetch(),
    ]).finally(() => {
      setIsPullRefreshing(false);
    });
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-4 gap-5 pb-10"
      refreshControl={
        <RefreshControl
          refreshing={
            isPullRefreshing ||
            (quoteQuery.isRefetching && !quoteQuery.isPending)
          }
          onRefresh={handleRefresh}
        />
      }>
      <ScreenState
        isLoading={quoteQuery.isPending}
        errorMessage={
          quoteQuery.isError ? "No se pudo cargar la facturación." : null
        }
        onRetry={() => {
          void quoteQuery.refetch();
          void paymentsQuery.refetch();
        }}>
        {quote ? (
          <View className="gap-5">
            {!quote.wisproLinked ? (
              <Alert icon={Info}>
                <AlertTitle>Cuenta no vinculada</AlertTitle>
                <AlertDescription>
                  No hay facturas del servicio asociadas. Contacta a soporte
                  por el chat para vincular tu cuenta.
                </AlertDescription>
              </Alert>
            ) : null}

            {quote.billingStale ? (
              <Alert icon={Info}>
                <AlertTitle>Saldo en revisión</AlertTitle>
                <AlertDescription>
                  No pudimos actualizar la deuda ahora. Mostramos el último
                  saldo conocido.
                </AlertDescription>
              </Alert>
            ) : null}

            {pending ? (
              <Alert icon={AlertCircle} variant="destructive">
                <AlertTitle>Tienes pagos pendientes</AlertTitle>
                <AlertDescription>
                  Ponte al día y recupera tu servicio de fibra óptica.
                </AlertDescription>
              </Alert>
            ) : quote.wisproLinked ? (
              <Alert icon={CheckCircle2}>
                <AlertTitle>Estás al día</AlertTitle>
                <AlertDescription>
                  No tienes saldo pendiente en tu servicio de fibra óptica.
                </AlertDescription>
              </Alert>
            ) : null}

            <Card className="overflow-hidden border-border/80 bg-card/95 py-0 shadow-xl shadow-black/10">
              <View className="h-1 w-full bg-primary" />
              <CardHeader className="gap-2 pt-5">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Icon as={CreditCard} size={18} className="text-primary" />
                    <CardTitle className="text-base font-bold">
                      Saldo del servicio
                    </CardTitle>
                  </View>
                  <AccountStatusBadge status={quote.accountStatus} />
                </View>
                <CardDescription className="text-xs">
                  Conexiones Innover · {quote.planName ?? "Servicio"}
                  {quote.periodLabel ? ` · ${quote.periodLabel}` : ""}
                </CardDescription>
              </CardHeader>

              <CardContent className="gap-3 pb-5">
                <View className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <Text className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Total a pagar
                  </Text>
                  <Text className="mt-1 text-3xl font-black tracking-tight text-foreground">
                    {debtUsdLabel}
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

                {quote.dueHint ? (
                  <Text className="text-xs text-muted-foreground">
                    {quote.dueHint}
                  </Text>
                ) : null}

                {pending ? (
                  <Button
                    className="h-12 min-h-12 w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary shadow-lg shadow-primary/30 active:opacity-90"
                    onPress={handlePay}
                    accessibilityLabel="Pagar servicio">
                    <Icon
                      as={CreditCard}
                      size={16}
                      className="text-primary-foreground"
                    />
                    <Text className="text-xs font-bold uppercase tracking-wider text-primary-foreground">
                      Pagar servicio
                    </Text>
                    <Icon
                      as={ArrowRight}
                      size={16}
                      className="text-primary-foreground"
                    />
                  </Button>
                ) : (
                  <View className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
                    <Text className="text-sm font-semibold text-foreground">
                      Sin cuotas por pagar
                    </Text>
                    <Text className="mt-1 text-xs text-muted-foreground">
                      Cuando tengas un saldo pendiente, el formulario de pago
                      aparecerá aquí.
                    </Text>
                  </View>
                )}
              </CardContent>
            </Card>

            {quote.pendingInvoices.length > 0 ? (
              <Card className="border-border/80 bg-card/95">
                <CardHeader className="gap-1 pb-2">
                  <View className="flex-row items-center gap-2">
                    <Icon as={Receipt} size={16} className="text-primary" />
                    <CardTitle className="text-base font-bold">
                      Facturas pendientes
                    </CardTitle>
                  </View>
                  <CardDescription className="text-xs">
                    Facturas abiertas del servicio
                  </CardDescription>
                </CardHeader>
                <CardContent className="gap-2.5">
                  {quote.pendingInvoices.map((invoice) => (
                    <View
                      key={invoice.id}
                      className="rounded-2xl border border-border/70 bg-muted/20 px-3.5 py-3 gap-1">
                      <View className="flex-row items-center justify-between gap-2">
                        <Text className="text-sm font-bold text-foreground">
                          {invoice.invoiceNumber
                            ? `Factura ${invoice.invoiceNumber}`
                            : "Factura pendiente"}
                        </Text>
                        <Text className="text-sm font-black text-foreground">
                          {invoice.balanceUsdFormatted}
                        </Text>
                      </View>
                      {invoice.concept ? (
                        <Text className="text-xs text-muted-foreground">
                          {invoice.concept}
                        </Text>
                      ) : null}
                      {invoice.firstDueDate ? (
                        <Text className="text-[11px] text-muted-foreground">
                          Vence {invoice.firstDueDate}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            <Card className="border-border/80 bg-card/95">
              <CardHeader className="gap-1 pb-2">
                <CardTitle className="text-base font-bold">
                  Historial de pagos
                </CardTitle>
                <CardDescription className="text-xs">
                  Reportes recibidos para tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent className="gap-2.5">
                {paymentsQuery.isPending ? (
                  <Text className="text-xs text-muted-foreground">
                    Cargando pagos…
                  </Text>
                ) : paymentsQuery.isError ? (
                  <Text className="text-xs text-destructive">
                    No se pudo cargar el historial de pagos.
                  </Text>
                ) : (paymentsQuery.data?.length ?? 0) === 0 ? (
                  <View className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
                    <Text className="text-sm font-semibold text-foreground">
                      Sin pagos registrados
                    </Text>
                    <Text className="mt-1 text-xs text-muted-foreground">
                      Cuando reportes un comprobante, aparecerá aquí como
                      recibido o en revisión.
                    </Text>
                  </View>
                ) : (
                  paymentsQuery.data?.map((payment) => (
                    <View
                      key={payment.id}
                      className="rounded-2xl border border-border/70 bg-muted/20 px-3.5 py-3 gap-1">
                      <View className="flex-row items-center justify-between gap-2">
                        <Text className="text-sm font-bold text-foreground">
                          {payment.amountFormatted ?? "Monto por confirmar"}
                        </Text>
                        <Badge
                          variant="outline"
                          className="border-border/70 bg-background/60 px-2 py-0.5">
                          <Text className="text-[10px] font-bold text-muted-foreground">
                            {paymentRecordStatusLabel(String(payment.status))}
                          </Text>
                        </Badge>
                      </View>
                      {payment.bank ? (
                        <Text className="text-xs text-muted-foreground">
                          {payment.bank}
                        </Text>
                      ) : null}
                      {payment.paymentDate || payment.createdAt ? (
                        <Text className="text-[11px] text-muted-foreground">
                          {payment.paymentDate ||
                            payment.createdAt?.slice(0, 10)}
                          {payment.transactionCode
                            ? ` · Ref. ${payment.transactionCode}`
                            : ""}
                        </Text>
                      ) : null}
                    </View>
                  ))
                )}
              </CardContent>
            </Card>

            {quote.officeClosed ? (
              <Alert icon={Info}>
                <AlertTitle>Oficina fuera de horario</AlertTitle>
                <AlertDescription>
                  Puedes registrar tu pago las 24 horas. La validación humana se
                  realiza en horario de oficina
                  {quote.nextOpenLabel
                    ? ` (próxima apertura: ${quote.nextOpenLabel})`
                    : "."}
                </AlertDescription>
              </Alert>
            ) : null}
          </View>
        ) : null}
      </ScreenState>
    </ScrollView>
  );
};
