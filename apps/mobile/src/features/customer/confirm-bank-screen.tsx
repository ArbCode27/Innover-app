import type { BillingStackParamList } from "@/app/navigation-types";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { ScreenState } from "@/components/screen-state";
import {
  PaymentBottomBar,
  PaymentStepHeader,
} from "@/features/customer/payment-chrome";
import { fetchPaymentInstructions } from "@/features/customer/payment-instructions-gateway";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Building2, CircleDollarSign } from "lucide-react-native";
import * as React from "react";
import { View } from "react-native";

export const ConfirmBankScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<BillingStackParamList>>();
  const route = useRoute<RouteProp<BillingStackParamList, "ConfirmarBanco">>();
  const { methodId } = route.params;

  const instructionsQuery = useQuery({
    queryKey: ["payment-instructions", methodId],
    queryFn: () => fetchPaymentInstructions(methodId),
  });

  const instructions = instructionsQuery.data;

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 gap-5 p-4">
        <PaymentStepHeader
          step={2}
          title="Confirma el destino y el monto"
          description="Revisa el banco y el importe antes de ver los datos para pagar."
        />

        <ScreenState
          isLoading={instructionsQuery.isPending}
          errorMessage={
            instructionsQuery.isError
              ? "No se pudieron cargar los datos de pago."
              : null
          }
          onRetry={() => {
            void instructionsQuery.refetch();
          }}
        >
          {instructions ? (
            <Card className="overflow-hidden border-border/80 bg-card/95 py-0 shadow-xl shadow-black/10">
              <View className="h-1 w-full bg-primary" />
              <CardContent className="gap-0 px-4 py-2">
                <View className="flex-row items-center gap-3 border-b border-border/70 py-4">
                  <View className="size-12 items-center justify-center rounded-full bg-primary/10">
                    <Icon as={Building2} size={22} className="text-primary" />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Banco
                    </Text>
                    <Text className="text-base font-semibold text-foreground">
                      {instructions.bankName.trim() ||
                        "Solicítalo por el chat"}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-3 py-4">
                  <View className="size-12 items-center justify-center rounded-full bg-primary/10">
                    <Icon
                      as={CircleDollarSign}
                      size={22}
                      className="text-primary"
                    />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Monto
                    </Text>
                    <Text className="text-base font-semibold text-foreground">
                      {instructions.confirmAmountLabel}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          ) : null}
        </ScreenState>
      </View>

      <PaymentBottomBar
        label="Continuar"
        accessibilityLabel="Continuar al detalle de pago"
        disabled={!instructions}
        onPress={() => {
          navigation.navigate("DatosPago", { methodId });
        }}
      />
    </View>
  );
};
