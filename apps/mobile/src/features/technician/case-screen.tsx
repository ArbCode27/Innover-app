import type { TechnicianStackParamList } from "@/app/navigation-types";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import { ScreenState } from "@/components/screen-state";
import { useAuthSession } from "@/features/auth/auth-session";
import {
  formatTicketInstant,
  formatTicketWindow,
} from "@/features/customer/format-window";
import { ticketStatusLabel } from "@/features/customer/ticket-status-badge";
import { useVoiceRecorder } from "@/features/chat/use-voice-recorder";
import {
  CLOSE_OBSERVATION_MAX_CHARS,
  transcribeCloseObservation,
} from "@/features/technician/close-observation-transcribe";
import {
  openCasoInMaps,
  resolveCasoMapsUrl,
} from "@/features/technician/maps-opener";
import { TicketPriorityBadge } from "@/features/technician/ticket-priority-badge";
import { ticketPriorityChrome } from "@/features/technician/ticket-priority";
import {
  closeTechnicianVisit,
  fetchTechnicianCaso,
} from "@/features/technician/technician-gateway";
import {
  technicianCasoKey,
  technicianQueueKey,
  technicianResolvedKey,
  useTechnicianCasosRealtime,
} from "@/features/technician/use-casos-realtime";
import { toUserFacingMessage } from "@/lib/user-facing-error";
import { cn } from "@/lib/utils";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck2,
  CheckCircle2,
  CircleAlert,
  Clock3,
  ImageIcon,
  MapPin,
  Mic,
  Navigation,
  Phone,
  Square,
  Ticket,
  Wrench,
} from "lucide-react-native";
import * as React from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";

const InfoRow = ({
  icon,
  label,
  value,
  accentClassName,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  accentClassName: string;
}) => (
  <View className="flex-row items-start gap-3">
    <View
      className={cn(
        "mt-0.5 h-9 w-9 items-center justify-center rounded-xl bg-card",
        "border border-border/70",
      )}
    >
      <Icon as={icon} size={18} className={accentClassName} />
    </View>
    <View className="min-w-0 flex-1 gap-0.5">
      <Text className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Text>
      <Text className="text-base text-foreground">{value}</Text>
    </View>
  </View>
);

export const TechnicianCaseScreen = () => {
  const { profile } = useAuthSession();
  const queryClient = useQueryClient();
  const navigation =
    useNavigation<NativeStackNavigationProp<TechnicianStackParamList>>();
  const route = useRoute<RouteProp<TechnicianStackParamList, "Caso">>();
  const casoId = route.params.casoId;
  const employeeId = profile?.technicianId ?? null;
  const recorder = useVoiceRecorder();
  const [observation, setObservation] = React.useState("");
  const [audioReady, setAudioReady] = React.useState(false);
  const [isTranscribing, setIsTranscribing] = React.useState(false);
  const [transcribeError, setTranscribeError] = React.useState<string | null>(
    null,
  );
  const [needsObservation, setNeedsObservation] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [mapsError, setMapsError] = React.useState<string | null>(null);

  useTechnicianCasosRealtime(employeeId);

  const observationForClose = () => observation.trim();

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
      setTranscribeError(null);
      await queryClient.invalidateQueries({
        queryKey: technicianQueueKey(employeeId),
      });
      await queryClient.invalidateQueries({
        queryKey: technicianResolvedKey(employeeId),
      });
      await queryClient.invalidateQueries({
        queryKey: technicianCasoKey(employeeId, casoId),
      });
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    },
  });

  // Cierre siempre con texto ≥3 (escrito o transcrito por IA).
  const hasObservation = observation.trim().length >= 3;
  const observationLength = observation.trim().length;
  const caso = casoQuery.data ?? null;
  const canClose =
    caso != null && (caso.status === "open" || caso.status === "scheduled");
  const mapsUrl = caso ? resolveCasoMapsUrl(caso) : null;
  const windowLabel = caso
    ? formatTicketWindow(caso.windowStart, caso.windowEnd)
    : null;
  const closedAtLabel = caso ? formatTicketInstant(caso.closedAt) : null;
  const ticketLabel =
    caso?.wisproPublicId != null ? `#${caso.wisproPublicId}` : null;
  const chrome = caso ? ticketPriorityChrome(caso.priority) : null;
  const clientName = caso?.clientName?.trim() || "Cliente";
  const statusLabel = caso ? ticketStatusLabel(caso.status) : "";

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
    if (isTranscribing) {
      return;
    }
    if (recorder.isRecording) {
      const recorded = await recorder.handleStop();
      if (!recorded) {
        return;
      }
      setIsTranscribing(true);
      setTranscribeError(null);
      setAudioReady(false);
      try {
        const text = await transcribeCloseObservation(profile, recorded);
        setObservation(text);
        setAudioReady(true);
        setNeedsObservation(false);
      } catch (error) {
        if (__DEV__) {
          console.warn("[case] transcribe UI", error);
        }
        setTranscribeError(
          toUserFacingMessage(
            error,
            "No se pudo transcribir el audio. Inténtalo de nuevo.",
          ),
        );
      } finally {
        setIsTranscribing(false);
      }
      return;
    }
    setTranscribeError(null);
    await recorder.handleStart();
  };

  const handleOpenMaps = async () => {
    if (!caso || !mapsUrl) {
      return;
    }
    setMapsError(null);
    try {
      await openCasoInMaps(caso);
    } catch (error) {
      setMapsError(
        toUserFacingMessage(
          error,
          "No se pudo abrir Maps. Inténtalo de nuevo.",
        ),
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
        {caso && chrome ? (
          <ScrollView
            contentContainerClassName="gap-4 p-4 pb-10"
            keyboardShouldPersistTaps="handled"
          >
            <View
              className={cn(
                "overflow-hidden rounded-2xl border bg-card shadow-sm shadow-black/5",
                chrome.border,
              )}
            >
              <View className="flex-row">
                <View className={cn("w-1.5 self-stretch", chrome.bar)} />
                <View className={cn("flex-1 gap-4 p-4", chrome.tint)}>
                  <View className="gap-2">
                    <Text className="text-xl font-semibold text-foreground">
                      {clientName}
                    </Text>
                    <View className="flex-row flex-wrap items-center gap-2">
                      <TicketPriorityBadge
                        priority={caso.priority}
                        priorityLabel={caso.priorityLabel}
                      />
                      <Badge variant="outline" className="shrink-0 px-2.5">
                        <Text className="text-xs font-medium text-foreground">
                          {statusLabel}
                        </Text>
                      </Badge>
                      {ticketLabel ? (
                        <Badge
                          variant="secondary"
                          className="shrink-0 gap-1 px-2.5"
                        >
                          <Icon
                            as={Ticket}
                            size={12}
                            className="text-secondary-foreground"
                          />
                          <Text className="text-xs font-medium text-secondary-foreground">
                            {ticketLabel}
                          </Text>
                        </Badge>
                      ) : null}
                    </View>
                    <Text className="text-base text-muted-foreground">
                      {caso.title}
                    </Text>
                  </View>

                  <View className="gap-3.5 rounded-2xl border border-border/70 bg-card/90 px-3.5 py-3.5">
                    <InfoRow
                      icon={Wrench}
                      label="Causa"
                      value={caso.cause?.trim() || caso.title}
                      accentClassName={chrome.accentText}
                    />
                    <InfoRow
                      icon={MapPin}
                      label="Zona"
                      value={caso.addressText?.trim() || "Sin zona"}
                      accentClassName={chrome.accentText}
                    />
                    <InfoRow
                      icon={Clock3}
                      label="Ventana horaria"
                      value={windowLabel ?? "Sin ventana asignada todavía"}
                      accentClassName={chrome.accentText}
                    />
                    {!canClose && closedAtLabel ? (
                      <InfoRow
                        icon={CalendarCheck2}
                        label="Fecha de cierre"
                        value={closedAtLabel}
                        accentClassName={chrome.accentText}
                      />
                    ) : null}
                    {caso.clientPhone ? (
                      <InfoRow
                        icon={Phone}
                        label="Teléfono"
                        value={caso.clientPhone}
                        accentClassName={chrome.accentText}
                      />
                    ) : null}
                  </View>

                  {mapsUrl ? (
                    <View className="w-full gap-2">
                      <Button
                        onPress={() => {
                          void handleOpenMaps();
                        }}
                        accessibilityLabel="Abrir en Maps"
                        className="w-full"
                      >
                        <Icon
                          as={Navigation}
                          size={18}
                          className="text-primary-foreground"
                        />
                        <Text>Abrir en Maps</Text>
                      </Button>
                      {mapsError ? (
                        <Text className="text-sm text-destructive">
                          {mapsError}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {caso.facadeMediaUrl ? (
              <View className="overflow-hidden rounded-2xl border border-border bg-card">
                <View className="flex-row items-center gap-2 border-b border-border px-4 py-3">
                  <Icon as={ImageIcon} size={18} className="text-primary" />
                  <Text className="font-semibold text-foreground">Fachada</Text>
                </View>
                <Image
                  source={{ uri: caso.facadeMediaUrl }}
                  className="h-52 w-full"
                  accessibilityLabel="Foto de fachada"
                  resizeMode="cover"
                />
              </View>
            ) : (
              <Alert icon={CircleAlert}>
                <AlertTitle>Sin foto de fachada</AlertTitle>
                <AlertDescription>
                  Este caso no tiene imagen de fachada en el CRM.
                </AlertDescription>
              </Alert>
            )}

            {!canClose && (caso.resolutionObservation || closedAtLabel) ? (
              <View className="gap-2 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-4">
                <View className="flex-row items-center gap-2">
                  <Icon
                    as={CheckCircle2}
                    size={18}
                    className="text-emerald-700 dark:text-emerald-300"
                  />
                  <Text className="font-semibold text-emerald-700 dark:text-emerald-300">
                    Visita cerrada
                  </Text>
                </View>
                {closedAtLabel ? (
                  <Text className="text-sm text-muted-foreground">
                    Cerrado: {closedAtLabel}
                  </Text>
                ) : null}
                {caso.resolutionObservation ? (
                  <Text className="text-base text-foreground">
                    {caso.resolutionObservation}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {canClose ? (
              <View className="gap-4 rounded-2xl border border-primary/25 bg-primary/5 p-4">
                <View className="gap-1">
                  <Text className="text-lg font-semibold text-foreground">
                    Finalizar visita
                  </Text>
                  <Text variant="muted">
                    Escribe el reporte o dictalo por audio. La IA lo transcribe
                    y puedes editarlo antes de cerrar (mínimo 3 caracteres).
                  </Text>
                </View>

                <View className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-medium text-foreground">
                      Observación de cierre
                    </Text>
                    <Text
                      className={cn(
                        "text-xs",
                        hasObservation
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-muted-foreground",
                      )}
                    >
                      {observationLength}/{CLOSE_OBSERVATION_MAX_CHARS}
                    </Text>
                  </View>
                  <Textarea
                    accessibilityLabel="Observación de cierre"
                    placeholder="Ej.: se cambió el conector y quedó operativo"
                    value={observation}
                    editable={!isTranscribing}
                    maxLength={CLOSE_OBSERVATION_MAX_CHARS}
                    onChangeText={(value) => {
                      setObservation(value);
                      if (value.trim().length >= 3) {
                        setNeedsObservation(false);
                      }
                    }}
                    numberOfLines={5}
                    className="min-h-28 rounded-xl bg-card"
                  />
                </View>

                <Button
                  variant={recorder.isRecording ? "destructive" : "outline"}
                  onPress={() => {
                    void handleVoice();
                  }}
                  disabled={isTranscribing || closeMutation.isPending}
                  accessibilityLabel={
                    recorder.isRecording
                      ? "Detener grabación y transcribir"
                      : isTranscribing
                        ? "Transcribiendo audio"
                        : "Grabar reporte por voz"
                  }
                  className="w-full"
                >
                  {isTranscribing ? (
                    <ActivityIndicator accessibilityLabel="Transcribiendo" />
                  ) : (
                    <Icon
                      as={recorder.isRecording ? Square : Mic}
                      size={18}
                      className={
                        recorder.isRecording
                          ? "text-white"
                          : "text-foreground"
                      }
                    />
                  )}
                  <Text>
                    {isTranscribing
                      ? "Transcribiendo…"
                      : recorder.isRecording
                        ? `Detener y transcribir (${recorder.elapsedSeconds}s)`
                        : audioReady
                          ? "Volver a grabar audio"
                          : "Dictar reporte por voz"}
                  </Text>
                </Button>

                {audioReady && hasObservation ? (
                  <Text variant="muted">
                    Transcripción lista. Revísala o edítala y confirma el
                    cierre.
                  </Text>
                ) : null}
                {recorder.errorMessage ? (
                  <Text className="text-sm text-destructive">
                    {recorder.errorMessage}
                  </Text>
                ) : null}
                {transcribeError ? (
                  <Text className="text-sm text-destructive">
                    {transcribeError}
                  </Text>
                ) : null}
                {needsObservation ? (
                  <Alert icon={CircleAlert} variant="destructive">
                    <AlertTitle>Falta la observación</AlertTitle>
                    <AlertDescription>
                      Escribe o dicta al menos 3 caracteres para cerrar la
                      visita.
                    </AlertDescription>
                  </Alert>
                ) : null}
                {closeMutation.isError ? (
                  <Text className="text-sm text-destructive">
                    {toUserFacingMessage(
                      closeMutation.error,
                      "No se pudo cerrar la visita. Inténtalo de nuevo.",
                    )}
                  </Text>
                ) : null}

                <Button
                  size="lg"
                  onPress={handleReady}
                  disabled={
                    closeMutation.isPending ||
                    isTranscribing ||
                    recorder.isRecording
                  }
                  accessibilityLabel="Cerrar visita"
                  className="w-full"
                >
                  <Icon
                    as={CheckCircle2}
                    size={18}
                    className="text-primary-foreground"
                  />
                  <Text>
                    {closeMutation.isPending
                      ? "Cerrando visita…"
                      : "Cerrar visita"}
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
              <Text>Confirmar cierre</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </KeyboardAvoidingView>
  );
};
