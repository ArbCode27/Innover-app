import type {
  BillingStackParamList,
  CustomerStackParamList,
} from "@/app/navigation-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { ScreenState } from "@/components/screen-state";
import { fetchPaymentInstructions } from "@/features/customer/payment-instructions-gateway";
import {
  useNavigation,
  useRoute,
  type CompositeNavigationProp,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { CircleCheck, Home } from "lucide-react-native";
import * as React from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ReceivedNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<BillingStackParamList, "PagoRecibido">,
  NativeStackNavigationProp<CustomerStackParamList>
>;

const SummaryRow = ({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) => (
  <View
    className={
      last
        ? "flex-row items-center justify-between gap-4 py-3.5"
        : "flex-row items-center justify-between gap-4 border-b border-border/70 py-3.5"
    }
  >
    <Text className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
    </Text>
    <Text className="flex-1 text-right text-sm font-semibold text-foreground">
      {value}
    </Text>
  </View>
);

export const PaymentReceivedScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ReceivedNavigation>();
  const route = useRoute<RouteProp<BillingStackParamList, "PagoRecibido">>();
  const { methodId } = route.params;

  const instructionsQuery = useQuery({
    queryKey: ["payment-instructions", methodId],
    queryFn: () => fetchPaymentInstructions(methodId),
  });

  const instructions = instructionsQuery.data;

  const handleGoHome = () => {
    navigation.navigate("CustomerTabs", { screen: "Inicio" });
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-5 pb-8"
      >
        <Card className="overflow-hidden border-border/80 bg-card/95 py-0 shadow-xl shadow-black/10">
          <View className="h-1 w-full bg-primary" />
          <CardContent className="items-start gap-4 px-4 py-5">
            <View className="size-14 items-center justify-center rounded-full bg-primary/15">
              <Icon as={CircleCheck} size={32} className="text-primary" />
            </View>
            <View className="gap-1.5">
              <Text className="text-xl font-bold tracking-tight text-foreground">
                Comprobante recibido
              </Text>
              <Text className="text-sm leading-relaxed text-muted-foreground">
                Quedó en revisión. Un asesor lo valida en el CRM. El estado es
                recibido, no aprobado desde la app.
              </Text>
            </View>
          </CardContent>
        </Card>

        <ScreenState
          isLoading={instructionsQuery.isPending}
          errorMessage={
            instructionsQuery.isError
              ? "No se pudo cargar el resumen del pago."
              : null
          }
          onRetry={() => {
            void instructionsQuery.refetch();
          }}
        >
          {instructions ? (
            <Card className="overflow-hidden border-border/80 bg-card/95 py-0 shadow-xl shadow-black/10">
              <View className="h-1 w-full bg-primary" />
              <CardContent className="px-4 pb-2 pt-1">
                <SummaryRow label="Monto" value={instructions.amountLine} />
                <SummaryRow label="Banco" value={instructions.bankName} />
                <SummaryRow label="Destino" value="Conexiones Innover" />
                <SummaryRow
                  label="Método de pago"
                  value={instructions.methodTitle}
                  last
                />
              </CardContent>
            </Card>
          ) : null}
        </ScreenState>
      </ScrollView>

      <View
        className="gap-2.5 border-t border-border/70 bg-background px-4 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <Button
          onPress={handleGoHome}
          accessibilityLabel="Ir al inicio"
          className="h-12 min-h-12 w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary shadow-lg shadow-primary/30 active:opacity-90"
        >
          <Icon as={Home} size={16} className="text-primary-foreground" />
          <Text className="text-xs font-bold uppercase tracking-wider text-primary-foreground">
            Ir al inicio
          </Text>
        </Button>
        <Button
          variant="outline"
          onPress={() => {
            navigation.navigate("AdjuntarComprobante", { methodId });
          }}
          accessibilityLabel="Ese no es el pago, adjuntar otro comprobante"
          className="h-12 min-h-12 w-full rounded-xl"
        >
          <Text className="text-xs font-semibold">Ese no es el pago</Text>
        </Button>
      </View>
    </View>
  );
};
