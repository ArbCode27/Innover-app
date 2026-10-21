import type { BillingStackParamList } from "@/app/navigation-types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Info,
} from "lucide-react-native";
import * as React from "react";
import { ScrollView, View } from "react-native";

export const CustomerBillingScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<BillingStackParamList>>();

  const quoteQuery = useQuery({
    queryKey: ["account-quote"],
    queryFn: fetchAccountQuote,
  });

  const quote = quoteQuery.data;
  const pending = quote ? hasPendingDebt(quote) : false;

  const handlePay = () => {
    navigation.navigate("MetodoPago");
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-4 gap-5 pb-10">
      <ScreenState
        isLoading={quoteQuery.isPending}
        errorMessage={
          quoteQuery.isError ? "No se pudo cargar la facturación." : null
        }
        onRetry={() => {
          void quoteQuery.refetch();
        }}>
        {quote ? (
          <View className="gap-5">
            {pending ? (
              <Alert icon={AlertCircle} variant="destructive">
                <AlertTitle>Tienes pagos pendientes</AlertTitle>
                <AlertDescription>
                  Ponte al día y recupera tu servicio de fibra óptica.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert icon={CheckCircle2}>
                <AlertTitle>Estás al día</AlertTitle>
                <AlertDescription>
                  No tienes saldo pendiente en tu servicio de fibra óptica.
                </AlertDescription>
              </Alert>
            )}

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
                  Conexiones Innover · {quote.planName ?? "Servicio de fibra óptica"}
                  {quote.periodLabel ? ` · ${quote.periodLabel}` : ""}
                </CardDescription>
              </CardHeader>

              <CardContent className="gap-3 pb-5">
                <View className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <Text className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Total a pagar este mes
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
                      Cuando tengas un saldo pendiente, el proceso de pago
                      aparecerá aquí.
                    </Text>
                  </View>
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
