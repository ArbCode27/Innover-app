import type { TechnicianTabParamList } from "@/app/navigation-types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { ScreenState } from "@/components/screen-state";
import { useAuthSession } from "@/features/auth/auth-session";
import { formatTicketWindow } from "@/features/customer/format-window";
import { TicketStatusBadge } from "@/features/customer/ticket-status-badge";
import { useVoiceRecorder } from "@/features/chat/use-voice-recorder";
import {
  closeTechnicianVisit,
  fetchTechnicianCaso,
} from "@/features/technician/technician-gateway";
import {
  openCasoInMaps,
  resolveCasoMapsUrl,
} from "@/features/technician/maps-opener";
import {
  technicianCasoKey,
  technicianQueueKey,
  useTechnicianCasosRealtime,
} from "@/features/technician/use-casos-realtime";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleAlert, Mic, Square } from "lucide-react-native";
import * as React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";

const CaseRow = ({ label, value }: { label: string; value: string }) => (
  <View className="gap-1">
    <Text variant="muted">{label}</Text>
    <Text>{value}</Text>
  </View>
);

export const TechnicianCaseScreen = () => {
  const { profile } = useAuthSession();
  const queryClient = useQueryClient();
  const route = useRoute<RouteProp<TechnicianTabParamList, "Caso">>();
  const casoId = route.params?.casoId;
  const employeeId = profile?.technicianId ?? null;
  const recorder = useVoiceRecorder();
  const [observation, setObservation] = React.useState("");
  const [audioReady, setAudioReady] = React.useState(false);
  const [needsObservation, setNeedsObservation] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [mapsError, setMapsError] = React.useState<string | null>(null);

  useTechnicianCasosRealtime(employeeId);

  const observationForClose = () => {
    const text = observation.trim();
    if (text.length >= 3) {
      return text;
    }
    if (audioReady) {
      return "Nota de voz de cierre";
    }
    return "";
  };

  const casoQuery = useQuery({
    queryKey: technicianCasoKey(employeeId, casoId),
    queryFn: () => fetchTechnicianCaso(profile, casoId),
    enabled: Boolean(employeeId && casoId),
  });

  const closeMutation = useMutation({
    mutationFn: () =>
      closeTechnicianVisit(profile, {
        casoId: casoId ?? "",
        observation: observationForClose(),
      }),
    onSuccess: async () => {
      setConfirmOpen(false);
      setNeedsObservation(false);
      setObservation("");
      setAudioReady(false);
      await queryClient.invalidateQueries({
        queryKey: technicianQueueKey(employeeId),
      });
      await queryClient.invalidateQueries({
        queryKey: technicianCasoKey(employeeId, casoId),
      });
    },
  });

  const hasObservation = observation.trim().length >= 3 || audioReady;
  const caso = casoQuery.data ?? null;
  const canClose =
    caso != null && (caso.status === "open" || caso.status === "scheduled");
  const mapsUrl = caso ? resolveCasoMapsUrl(caso) : null;
  const windowLabel = caso
    ? formatTicketWindow(caso.windowStart, caso.windowEnd)
    : null;
  const ticketLabel =
    caso?.wisproPublicId != null ? `#${caso.wisproPublicId}` : null;

  const handleReady = () => {
    if (!hasObservation) {
      setNeedsObservation(true);
      setConfirmOpen(false);
      return;
    }
    setNeedsObservation(false);
    setConfirmOpen(true);
  };

  const handleVoice = async () => {
    if (recorder.isRecording) {
      const recorded = await recorder.handleStop();
      if (recorded) {
        setAudioReady(true);
        setNeedsObservation(false);
      }
      return;
    }
    await recorder.handleStart();
  };

  const handleOpenMaps = async () => {
    if (!caso) {
      return;
    }
    setMapsError(null);
    try {
      await openCasoInMaps(caso);
    } catch (error) {
      setMapsError(
        error instanceof Error
          ? error.message
          : "No se pudo abrir Maps.",
      );
    }
  };

  if (!casoId) {
    return (
      <View className="flex-1 bg-background">
        <ScreenState
          isEmpty
          emptyTitle="Elige un caso"
          emptyDescription="Abre un ticket de tu cola para ver la ficha y cerrar la visita."
        >
          <Text />
        </ScreenState>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={88}
    >
      <ScreenState
        isLoading={casoQuery.isPending}
        isEmpty={!casoQuery.isPending && !casoQuery.isError && !caso}
        emptyTitle="No encontramos ese caso"
        emptyDescription="Solo puedes ver tickets asignados a ti."
        errorMessage={casoQuery.isError ? "No se pudo cargar el caso." : null}
        onRetry={() => {
          void casoQuery.refetch();
        }}
      >
        {caso ? (
          <ScrollView contentContainerClassName="gap-4 p-4">
            <Card>
              <CardHeader>
                <CardTitle>{caso.clientName ?? "Cliente"}</CardTitle>
                <CardDescription>
                  {ticketLabel ? `Ticket ${ticketLabel} · ` : ""}
                  {caso.title}
                </CardDescription>
              </CardHeader>
              <CardContent className="gap-3">
                <TicketStatusBadge status={caso.status} />
                <CaseRow
                  label="Causa"
                  value={caso.cause?.trim() || caso.title}
                />
                <CaseRow
                  label="Zona"
                  value={caso.addressText?.trim() || "Sin zona"}
                />
                <CaseRow
                  label="Ventana horaria"
                  value={windowLabel ?? "Sin ventana asignada todavía"}
                />
                {caso.clientPhone ? (
                  <CaseRow label="Teléfono" value={caso.clientPhone} />
                ) : null}
                {caso.resolutionObservation ? (
                  <CaseRow
                    label="Observación"
                    value={caso.resolutionObservation}
                  />
                ) : null}
              </CardContent>
            </Card>

            {caso.facadeMediaUrl ? (
              <Card>
                <CardHeader>
                  <CardTitle>Fachada</CardTitle>
                </CardHeader>
                <CardContent>
                  <Image
                    source={{ uri: caso.facadeMediaUrl }}
                    className="h-48 w-full rounded-lg"
                    accessibilityLabel="Foto de fachada"
                    resizeMode="cover"
                  />
                </CardContent>
              </Card>
            ) : (
              <Alert icon={CircleAlert}>
                <AlertTitle>Sin foto de fachada</AlertTitle>
                <AlertDescription>
                  Este caso no tiene imagen de fachada en el CRM.
                </AlertDescription>
              </Alert>
            )}

            <Button
              variant="outline"
              disabled={!mapsUrl}
              onPress={() => {
                void handleOpenMaps();
              }}
              accessibilityLabel="Abrir en Maps"
            >
              <Text>{mapsUrl ? "Abrir en Maps" : "Sin Maps"}</Text>
            </Button>
            {mapsError ? (
              <Text className="text-destructive">{mapsError}</Text>
            ) : null}

            {canClose ? (
              <View className="gap-3">
                <Text>Observación de cierre</Text>
                <Textarea
                  accessibilityLabel="Observación de cierre"
                  placeholder="Qué hiciste en la visita"
                  value={observation}
                  onChangeText={(value) => {
                    setObservation(value);
                    if (value.trim().length >= 3) {
                      setNeedsObservation(false);
                    }
                  }}
                  numberOfLines={4}
                />
                <Button
                  variant="outline"
                  onPress={() => {
                    void handleVoice();
                  }}
                  accessibilityLabel={
                    recorder.isRecording
                      ? "Detener grabación"
                      : "Grabar observación en audio"
                  }
                >
                  <Icon
                    as={recorder.isRecording ? Square : Mic}
                    className="size-4"
                  />
                  <Text>
                    {recorder.isRecording
                      ? "Detener"
                      : audioReady
                        ? "Nota de voz lista"
                        : "Grabar audio"}
                  </Text>
                </Button>
                {recorder.errorMessage ? (
                  <Text className="text-destructive">
                    {recorder.errorMessage}
                  </Text>
                ) : null}
                {needsObservation ? (
                  <Alert icon={CircleAlert} variant="destructive">
                    <AlertTitle>Falta la observación</AlertTitle>
                    <AlertDescription>
                      Escribe o graba el reporte. No se cierra con solo
                      «Listo».
                    </AlertDescription>
                  </Alert>
                ) : null}
                {closeMutation.isError ? (
                  <Text className="text-destructive">
                    {closeMutation.error instanceof Error
                      ? closeMutation.error.message
                      : "No se pudo cerrar la visita."}
                  </Text>
                ) : null}
                <Button
                  onPress={handleReady}
                  disabled={closeMutation.isPending}
                  accessibilityLabel="Listo"
                >
                  <Text>
                    {closeMutation.isPending ? "Cerrando…" : "Listo"}
                  </Text>
                </Button>
              </View>
            ) : null}
          </ScrollView>
        ) : null}
      </ScreenState>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <Text>Cerrar visita</Text>
            </AlertDialogTitle>
            <AlertDialogDescription>
              <Text>
                Se guarda la observación y el caso queda cerrado en el CRM.
                Solo tus tickets.
              </Text>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>Cancelar</Text>
            </AlertDialogCancel>
            <AlertDialogAction
              onPress={() => {
                closeMutation.mutate();
              }}
            >
              <Text>Cerrar visita</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </KeyboardAvoidingView>
  );
};
