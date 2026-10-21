import type { BillingStackParamList } from "@/app/navigation-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { ScreenState } from "@/components/screen-state";
import {
  CopyValueRow,
  PaymentBottomBar,
  PaymentStepHeader,
} from "@/features/customer/payment-chrome";
import { fetchPaymentInstructions } from "@/features/customer/payment-instructions-gateway";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Copy } from "lucide-react-native";
import * as React from "react";
import { ScrollView, View } from "react-native";

export const PayDetailsScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<BillingStackParamList>>();
  const route = useRoute<RouteProp<BillingStackParamList, "DatosPago">>();
  const { methodId } = route.params;
  const [copiedAll, setCopiedAll] = React.useState(false);

  const instructionsQuery = useQuery({
    queryKey: ["payment-instructions", methodId],
    queryFn: () => fetchPaymentInstructions(methodId),
  });

  const instructions = instructionsQuery.data;

  const handleCopyAll = async () => {
    if (!instructions) {
      return;
    }
    const payload = instructions.fields
      .map((field) => `${field.label}: ${field.value}`)
      .join("\n");
    await copyTextToClipboard(payload);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1600);
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-5 pb-8"
      >
        <PaymentStepHeader
          step={3}
          title="Datos para pagar"
          description="Copia los datos y realiza el pago. Luego adjunta el comprobante."
        />

        <Badge variant="secondary" className="self-start px-3 py-1">
          <Text className="text-[11px] font-bold">Cuenta actualizada</Text>
        </Badge>

        <ScreenState
          isLoading={instructionsQuery.isPending}
          errorMessage={
            instructionsQuery.isError
              ? "No se pudieron cargar los datos bancarios."
              : null
          }
          onRetry={() => {
            void instructionsQuery.refetch();
          }}
        >
          {instructions ? (
            <Card className="overflow-hidden border-border/80 bg-card/95 py-0 shadow-xl shadow-black/10">
              <View className="h-1 w-full bg-primary" />
              <CardContent className="px-4 pb-4 pt-1">
                {instructions.fields.map((field, index) => (
                  <View
                    key={field.label}
                    className={
                      index < instructions.fields.length - 1
                        ? "border-b border-border/70"
                        : undefined
                    }
                  >
                    <CopyValueRow label={field.label} value={field.value} />
                  </View>
                ))}

                <Button
                  variant="outline"
                  onPress={() => {
                    void handleCopyAll();
                  }}
                  accessibilityLabel="Copiar todos los datos de pago"
                  className="mt-3 h-11 min-h-11 w-full flex-row items-center justify-center gap-2 rounded-xl"
                >
                  <Icon as={Copy} size={15} className="text-foreground" />
                  <Text className="text-sm font-semibold">
                    {copiedAll ? "Datos copiados" : "Copiar todos"}
                  </Text>
                </Button>

                <Text className="mt-3 text-xs text-muted-foreground">
                  Última actualización {instructions.updatedAtLabel}
                </Text>
              </CardContent>
            </Card>
          ) : null}
        </ScreenState>
      </ScrollView>

      <PaymentBottomBar
        label="Ya pagué"
        accessibilityLabel="Ya realicé el pago, adjuntar comprobante"
        disabled={!instructions}
        onPress={() => {
          navigation.navigate("AdjuntarComprobante", { methodId });
        }}
      />
    </View>
  );
};
