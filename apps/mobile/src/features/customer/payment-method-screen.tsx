import type { BillingStackParamList } from "@/app/navigation-types";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { fetchAccountQuote } from "@/features/customer/account-quote-gateway";
import {
  PaymentMethodRow,
  PaymentStepHeader,
} from "@/features/customer/payment-chrome";
import { PAYMENT_METHOD_OPTIONS } from "@/features/customer/payment-instructions-gateway";
import type { PaymentMethodId } from "@/types/domain";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  Building2,
  CircleDollarSign,
  Smartphone,
} from "lucide-react-native";
import * as React from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const iconForMethod = (id: PaymentMethodId) => {
  if (id === "pago_movil") {
    return Smartphone;
  }
  if (id === "transferencia") {
    return ArrowLeftRight;
  }
  if (id === "deposito_usd") {
    return CircleDollarSign;
  }
  return Building2;
};

export const PaymentMethodScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<BillingStackParamList>>();

  const quoteQuery = useQuery({
    queryKey: ["account-quote"],
    queryFn: fetchAccountQuote,
  });

  const handleSelect = (methodId: PaymentMethodId) => {
    navigation.navigate("ConfirmarBanco", { methodId });
  };

  const quote = quoteQuery.data;

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-5 pb-8"
      >
        <PaymentStepHeader
          step={1}
          title="¿Cómo vas a pagar?"
          description="Elige el método. Los montos salen de tu saldo en el servidor."
        />

        <View className="gap-3">
          {PAYMENT_METHOD_OPTIONS.map((option) => (
            <PaymentMethodRow
              key={option.id}
              title={option.title}
              description={option.description}
              icon={
                <Icon
                  as={iconForMethod(option.id)}
                  size={20}
                  className="text-primary"
                />
              }
              onPress={() => handleSelect(option.id)}
              accessibilityLabel={`Pagar con ${option.title}`}
            />
          ))}
        </View>
      </ScrollView>

      {quote ? (
        <View
          className="border-t border-border/70 bg-card px-4 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="flex-row items-end justify-between">
            <View className="gap-0.5">
              <Text className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Total a pagar
              </Text>
              <Text className="text-sm font-semibold text-foreground">
                Mensualidad de fibra
              </Text>
            </View>
            <View className="items-end gap-0.5">
              <Text className="text-base font-black text-foreground">
                {quote.debtUsdFormatted}
              </Text>
              {quote.debtBsFormatted ? (
                <Text className="text-xs font-semibold text-muted-foreground">
                  {quote.debtBsFormatted}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
};
