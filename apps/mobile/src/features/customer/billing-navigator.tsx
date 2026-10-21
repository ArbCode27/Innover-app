import type { BillingStackParamList } from "@/app/navigation-types";
import { AttachReceiptScreen } from "@/features/customer/attach-receipt-screen";
import { CustomerBillingScreen } from "@/features/customer/billing-screen";
import { ConfirmBankScreen } from "@/features/customer/confirm-bank-screen";
import { PayDetailsScreen } from "@/features/customer/pay-details-screen";
import { PaymentMethodScreen } from "@/features/customer/payment-method-screen";
import { PaymentReceivedScreen } from "@/features/customer/payment-received-screen";
import { THEME } from "@/lib/theme";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useColorScheme } from "nativewind";
import * as React from "react";

const BillingStack = createNativeStackNavigator<BillingStackParamList>();

export const CustomerBillingNavigator = () => {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "light" ? THEME.light : THEME.dark;

  return (
    <BillingStack.Navigator
      initialRouteName="Pagos"
      screenOptions={{
        headerShadowVisible: false,
        headerTintColor: theme.foreground,
        headerStyle: { backgroundColor: theme.background },
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 16,
        },
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <BillingStack.Screen
        name="Pagos"
        component={CustomerBillingScreen}
        options={{ headerShown: true, title: "Pagos" }}
      />
      <BillingStack.Screen
        name="MetodoPago"
        component={PaymentMethodScreen}
        options={{ title: "Método de pago" }}
      />
      <BillingStack.Screen
        name="ConfirmarBanco"
        component={ConfirmBankScreen}
        options={{ title: "" }}
      />
      <BillingStack.Screen
        name="DatosPago"
        component={PayDetailsScreen}
        options={{ title: "Último paso" }}
      />
      <BillingStack.Screen
        name="AdjuntarComprobante"
        component={AttachReceiptScreen}
        options={{ title: "Comprobante" }}
      />
      <BillingStack.Screen
        name="PagoRecibido"
        component={PaymentReceivedScreen}
        options={{ headerShown: false }}
      />
    </BillingStack.Navigator>
  );
};
