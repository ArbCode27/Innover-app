import type { BillingStackParamList } from "@/app/navigation-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useAuthSession } from "@/features/auth/auth-session";
import { sendClientDraft } from "@/features/chat/app-chat-gateway";
import {
  PaymentBottomBar,
  PaymentStepHeader,
} from "@/features/customer/payment-chrome";
import {
  pickReceiptFromCamera,
  pickReceiptFromLibrary,
  type PickedReceipt,
} from "@/features/customer/receipt-picker";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Image as ImageIcon } from "lucide-react-native";
import * as React from "react";
import { ActivityIndicator, Image, ScrollView, View } from "react-native";

export const AttachReceiptScreen = () => {
  const { profile } = useAuthSession();
  const queryClient = useQueryClient();
  const navigation =
    useNavigation<NativeStackNavigationProp<BillingStackParamList>>();
  const route =
    useRoute<RouteProp<BillingStackParamList, "AdjuntarComprobante">>();
  const { methodId } = route.params;

  const [picked, setPicked] = React.useState<PickedReceipt | null>(null);
  const [pickerError, setPickerError] = React.useState<string | null>(null);

  const handlePick = async (source: "camera" | "library") => {
    setPickerError(null);
    try {
      const next =
        source === "camera"
          ? await pickReceiptFromCamera()
          : await pickReceiptFromLibrary();
      if (next) {
        setPicked(next);
      }
    } catch (error) {
      setPickerError(
        error instanceof Error
          ? error.message
          : "No se pudo tomar o elegir la foto.",
      );
    }
  };

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!profile) {
        throw new Error("Inicia sesión para enviar el comprobante.");
      }
      if (!picked) {
        throw new Error("Adjunta la imagen del comprobante para continuar.");
      }
      return sendClientDraft({
        content: "Comprobante de pago",
        mediaType: "image",
        mediaUrl: picked.uri,
        mimeType: picked.mimeType,
        fileName: `comprobante-${Date.now()}.jpg`,
        caption: "Comprobante de pago",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["chat-snapshot"] });
      navigation.navigate("PagoRecibido", { methodId });
    },
    onError: (error) => {
      setPickerError(
        error instanceof Error
          ? error.message
          : "No se pudo enviar el comprobante.",
      );
    },
  });

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-5 pb-8"
      >
        <PaymentStepHeader
          step={4}
          title="Adjunta el comprobante"
          description="Toma o elige la foto del pago. Queda recibido y en revisión. Un asesor lo valida en el CRM."
        />

        <Card className="overflow-hidden border-border/80 bg-card/95 py-0 shadow-xl shadow-black/10">
          <View className="h-1 w-full bg-primary" />
          <CardContent className="px-4 py-4">
            {picked ? (
              <Image
                source={{ uri: picked.uri }}
                className="h-64 w-full rounded-xl"
                resizeMode="cover"
                accessibilityLabel="Vista previa del comprobante"
              />
            ) : (
              <View className="h-44 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6">
                <View className="size-12 items-center justify-center rounded-full bg-primary/10">
                  <Icon as={ImageIcon} size={22} className="text-primary" />
                </View>
                <Text className="mt-3 text-center text-sm text-muted-foreground">
                  Aún no hay imagen. Usa la cámara o la galería.
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        {pickerError ? (
          <Text className="text-sm text-destructive">{pickerError}</Text>
        ) : null}

        <View className="gap-2.5">
          <Button
            disabled={sendMutation.isPending}
            onPress={() => {
              void handlePick("camera");
            }}
            accessibilityLabel="Tomar foto del comprobante"
            className="h-12 min-h-12 w-full flex-row items-center justify-center gap-2 rounded-xl"
          >
            <Icon as={Camera} size={16} className="text-primary-foreground" />
            <Text className="text-xs font-bold uppercase tracking-wider text-primary-foreground">
              Cámara
            </Text>
          </Button>
          <Button
            variant="outline"
            disabled={sendMutation.isPending}
            onPress={() => {
              void handlePick("library");
            }}
            accessibilityLabel="Elegir foto de la galería"
            className="h-12 min-h-12 w-full flex-row items-center justify-center gap-2 rounded-xl"
          >
            <Icon as={ImageIcon} size={16} className="text-foreground" />
            <Text className="text-xs font-semibold text-foreground">
              Galería
            </Text>
          </Button>
        </View>
      </ScrollView>

      <PaymentBottomBar
        label={sendMutation.isPending ? "Enviando…" : "Enviar comprobante"}
        accessibilityLabel="Enviar comprobante de pago"
        disabled={!picked || sendMutation.isPending}
        onPress={() => sendMutation.mutate()}
      />

      {sendMutation.isPending ? (
        <View className="absolute inset-0 items-center justify-center bg-background/40">
          <ActivityIndicator accessibilityLabel="Enviando comprobante" />
        </View>
      ) : null}
    </View>
  );
};
