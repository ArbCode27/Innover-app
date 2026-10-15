import type { CustomerTabParamList } from "@/app/navigation-types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Text } from "@/components/ui/text";
import { ScreenState } from "@/components/screen-state";
import { useAuthSession } from "@/features/auth/auth-session";
import { AccountStatusBadge } from "@/features/customer/account-status-badge";
import { fetchAccountQuote } from "@/features/customer/account-quote-gateway";
import {
  pickReceiptFromCamera,
  pickReceiptFromLibrary,
} from "@/features/customer/receipt-picker";
import { uploadAppAttachment } from "@/features/chat/attachments-gateway";
import { sendClientDraft } from "@/features/chat/chat-gateway";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheck, Info } from "lucide-react-native";
import * as React from "react";
import { ScrollView, View } from "react-native";

export const CustomerBillingScreen = () => {
  const { profile } = useAuthSession();
  const navigation =
    useNavigation<BottomTabNavigationProp<CustomerTabParamList>>();
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pickerError, setPickerError] = React.useState<string | null>(null);
  const [receivedNotice, setReceivedNotice] = React.useState(false);

  const quoteQuery = useQuery({
    queryKey: ["account-quote"],
    queryFn: fetchAccountQuote,
  });

  const receiptMutation = useMutation({
    mutationFn: async (source: "camera" | "library") => {
      if (!profile) {
        throw new Error("Inicia sesión para enviar el comprobante.");
      }
      const picked =
        source === "camera"
          ? await pickReceiptFromCamera()
          : await pickReceiptFromLibrary();
      if (!picked) {
        return null;
      }
      const uploaded = await uploadAppAttachment({
        uri: picked.uri,
        mimeType: picked.mimeType,
        kind: "image",
        userId: profile.userId,
      });
      await sendClientDraft({
        content: "Comprobante de pago",
        mediaType: "image",
        mediaUrl: uploaded.uri,
        mimeType: uploaded.mimeType,
        caption: "Comprobante de pago",
      });
      return uploaded;
    },
    onSuccess: async (uploaded) => {
      setPickerOpen(false);
      if (!uploaded) {
        return;
      }
      setReceivedNotice(true);
      setPickerError(null);
      await queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
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
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4">
      <ScreenState
        isLoading={quoteQuery.isPending}
        errorMessage={
          quoteQuery.isError ? "No se pudo cargar la facturación." : null
        }
        onRetry={() => {
          void quoteQuery.refetch();
        }}
      >
        {quoteQuery.data ? (
          <View className="gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Facturación</CardTitle>
                <CardDescription>
                  Los montos salen del servidor. No se recalculan en el teléfono.
                </CardDescription>
              </CardHeader>
              <CardContent className="gap-3">
                <AccountStatusBadge status={quoteQuery.data.accountStatus} />
                <View className="gap-1">
                  <Text variant="muted">Deuda en dólares</Text>
                  <Text variant="large">{quoteQuery.data.debtUsdFormatted}</Text>
                </View>
                <View className="gap-1">
                  <Text variant="muted">Equivalente en bolívares</Text>
                  <Text variant="large">
                    {quoteQuery.data.debtBsFormatted ?? "Tasa BCV no disponible"}
                  </Text>
                </View>
                <Text variant="muted">
                  {quoteQuery.data.bcvRateDisplay
                    ? `Tasa BCV: ${quoteQuery.data.bcvRateDisplay}`
                    : "Sin tasa BCV en este momento."}
                </Text>
                <Button
                  onPress={() => {
                    setPickerError(null);
                    setPickerOpen(true);
                  }}
                  accessibilityLabel="Enviar comprobante"
                >
                  <Text>Enviar comprobante</Text>
                </Button>
              </CardContent>
            </Card>

            {receivedNotice ? (
              <Alert icon={CircleCheck}>
                <AlertTitle>Comprobante recibido</AlertTitle>
                <AlertDescription>
                  Quedó en revisión. Un asesor lo valida en el CRM. No pedimos
                  cédula en esta pantalla.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert icon={Info}>
                <AlertTitle>Cómo se registra un pago</AlertTitle>
                <AlertDescription>
                  Envía la foto del comprobante. La cédula y el registro los
                  pide Nova en el chat. El estado es recibido o en revisión,
                  nunca aprobado desde la app.
                </AlertDescription>
              </Alert>
            )}

            {receivedNotice ? (
              <Button
                variant="outline"
                onPress={() => navigation.navigate("Chat")}
                accessibilityLabel="Ver en el chat"
              >
                <Text>Ver en el chat</Text>
              </Button>
            ) : null}
          </View>
        ) : null}
      </ScreenState>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar comprobante</DialogTitle>
            <DialogDescription>
              Toma o elige una foto. No pedimos cédula aquí.
            </DialogDescription>
          </DialogHeader>
          {pickerError ? (
            <Text className="text-destructive">{pickerError}</Text>
          ) : null}
          <Button
            disabled={receiptMutation.isPending}
            onPress={() => receiptMutation.mutate("camera")}
            accessibilityLabel="Tomar foto con la cámara"
          >
            <Text>Cámara</Text>
          </Button>
          <Button
            variant="outline"
            disabled={receiptMutation.isPending}
            onPress={() => receiptMutation.mutate("library")}
            accessibilityLabel="Elegir foto de la galería"
          >
            <Text>Galería</Text>
          </Button>
        </DialogContent>
      </Dialog>
    </ScrollView>
  );
};
