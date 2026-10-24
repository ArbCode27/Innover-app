import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { ScreenState } from "@/components/screen-state";
import { useAuthSession } from "@/features/auth/auth-session";
import {
  fetchConversationSnapshot,
  retryFailedDraft,
  sendClientDraft,
} from "@/features/chat/app-chat-gateway";
import {
  CHAT_QUERY_KEY,
  dropOptimistic,
  upsertMessages,
} from "@/features/chat/chat-cache";
import {
  connectionStatusLabel,
  useChannelLiveStore,
} from "@/features/chat/channel-live-store";
import { useChatFocusStore } from "@/features/chat/chat-focus-store";
import { ChatComposer } from "@/features/chat/chat-composer";
import { useChatUnreadStore } from "@/features/chat/chat-unread-store";
import { useComposerStore } from "@/features/chat/composer-store";
import { pickChatDocument } from "@/features/chat/document-picker";
import {
  pickChatImage,
  pickChatVideo,
  takeChatPhoto,
} from "@/features/chat/image-picker";
import {
  buildChatLocationDraft,
  buildOutageLocationDraft,
} from "@/features/chat/location-sender";
import {
  formatDayLabel,
  MessageBubble,
} from "@/features/chat/message-bubble";
import { useKeyboardHeight } from "@/features/chat/use-keyboard-height";
import { useVoiceRecorder } from "@/features/chat/use-voice-recorder";
import { loadSession } from "@/lib/session-storage";
import { noticeFromUnknown } from "@/lib/user-notice";
import type { ChatSnapshot } from "@/types/app-channel";
import type { AppMessage, MessageMediaType, OutboundClientDraft } from "@/types/domain";
import { useIsFocused, useRoute } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Radio, UserRound } from "lucide-react-native";
import * as React from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Solo si Realtime no está live y el chat está enfocado. */
const POLL_WHEN_OFFLINE_MS = 20_000;

const sameSenderGroup = (left: AppMessage, right: AppMessage) =>
  left.type === right.type && left.senderType === right.senderType;

const sameDay = (left: string, right: string) =>
  left.slice(0, 10) === right.slice(0, 10);

const readChatIntent = (params: object | undefined) => {
  if (!params || !("intent" in params)) {
    return undefined;
  }
  const intent = params.intent;
  if (intent === "report-outage" || intent === "confirm-connection") {
    return intent;
  }
  return undefined;
};

export const ChatScreen = () => {
  const { session, profile, applySession } = useAuthSession();
  const queryClient = useQueryClient();
  const isFocused = useIsFocused();
  const isLive = useChannelLiveStore((state) => state.isLive);
  const connectionStatus = useChannelLiveStore((state) => state.status);
  const route = useRoute();
  const draft = useComposerStore((state) => state.draft);
  const failedDraft = useComposerStore((state) => state.failedDraft);
  const setDraft = useComposerStore((state) => state.setDraft);
  const markFailed = useComposerStore((state) => state.markFailed);
  const clearFailed = useComposerStore((state) => state.clearFailed);
  const recorder = useVoiceRecorder();
  const listRef = React.useRef<FlatList<AppMessage>>(null);
  const [pickerError, setPickerError] = React.useState<string | null>(null);
  const [pullRefreshing, setPullRefreshing] = React.useState(false);
  const outageSentRef = React.useRef(false);
  const confirmDraftRef = React.useRef(false);

  const isFieldRole =
    profile?.role === "technician" || profile?.role === "supervisor";

  React.useEffect(() => {
    useChatFocusStore.getState().setChatFocused(isFocused);
    return () => {
      useChatFocusStore.getState().setChatFocused(false);
    };
  }, [isFocused]);

  const snapshotQuery = useQuery({
    queryKey: CHAT_QUERY_KEY,
    queryFn: () => fetchConversationSnapshot(),
    enabled: Boolean(session),
    // Con Realtime live no hace falta refetch periódico ni al remount.
    staleTime: isLive ? 60_000 : 0,
    refetchOnMount: isLive ? false : true,
    refetchOnReconnect: !isLive,
    refetchInterval: isLive || !isFocused ? false : POLL_WHEN_OFFLINE_MS,
  });

  // Tras GET de campo: subir conversation + realtime al contexto de auth.
  React.useEffect(() => {
    if (!isFieldRole || !snapshotQuery.isSuccess) {
      return;
    }
    let cancelled = false;
    const sync = async () => {
      const stored = await loadSession();
      if (!stored || cancelled) {
        return;
      }
      const needsApply =
        stored.conversation?.id !== session?.conversation?.id ||
        stored.realtime?.accessToken !== session?.realtime?.accessToken ||
        stored.realtime?.conversationId !== session?.realtime?.conversationId;
      if (needsApply) {
        await applySession(stored);
      }
    };
    void sync();
    return () => {
      cancelled = true;
    };
  }, [
    applySession,
    isFieldRole,
    session?.conversation?.id,
    session?.realtime?.accessToken,
    session?.realtime?.conversationId,
    snapshotQuery.dataUpdatedAt,
    snapshotQuery.isSuccess,
  ]);

  React.useEffect(() => {
    if (!isFieldRole) {
      return;
    }
    const messages = snapshotQuery.data?.messages ?? [];
    const incomingIds = messages
      .filter(
        (message) =>
          message.senderType === "agent" || message.senderType === "bot",
      )
      .map((message) => message.id)
      .filter((id) => id > 0);
    useChatUnreadStore.getState().syncFromMessages(incomingIds, isFocused);
  }, [isFieldRole, isFocused, snapshotQuery.data?.messages]);

  const sendMutation = useMutation({
    mutationFn: sendClientDraft,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: CHAT_QUERY_KEY });
      const previous = queryClient.getQueryData<ChatSnapshot>(CHAT_QUERY_KEY);
      queryClient.setQueryData<ChatSnapshot>(CHAT_QUERY_KEY, (current) => {
        const snapshot = current ?? snapshotQuery.data;
        if (!snapshot) {
          return current;
        }
        const optimistic: AppMessage = {
          id: -Date.now(),
          conversationId: snapshot.conversation.id,
          type: "in",
          content: payload.content,
          senderType: isFieldRole ? "technician" : "client",
          sentBy: null,
          status: "pending",
          createdAt: new Date().toISOString(),
          mediaType: payload.mediaType,
          mediaUrl: payload.mediaUrl,
          mimeType: payload.mimeType,
          caption: payload.caption,
          latitude: payload.latitude,
          longitude: payload.longitude,
          locationName: payload.locationName,
        };
        return {
          ...snapshot,
          messages: [...snapshot.messages, optimistic],
        };
      });
      return { previous };
    },
    onSuccess: (sent) => {
      setDraft("");
      setPickerError(null);
      queryClient.setQueryData<ChatSnapshot>(CHAT_QUERY_KEY, (current) => {
        if (!current) {
          return {
            conversation: {
              id: sent.conversationId,
              status: session?.conversation?.status ?? "abierto",
              humanMode: session?.conversation?.humanMode ?? false,
            },
            messages: [sent],
          };
        }
        return {
          ...current,
          messages: upsertMessages(dropOptimistic(current.messages), [sent]),
        };
      });
    },
    onError: (_error, payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(CHAT_QUERY_KEY, context.previous);
      }
      markFailed(payload);
    },
  });

  const retryMutation = useMutation({
    mutationFn: retryFailedDraft,
    onSuccess: (sent) => {
      clearFailed();
      queryClient.setQueryData<ChatSnapshot>(CHAT_QUERY_KEY, (current) => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          messages: upsertMessages(dropOptimistic(current.messages), [sent]),
        };
      });
    },
  });

  const sendDraft = (payload: OutboundClientDraft) => {
    if (sendMutation.isPending) {
      return;
    }
    sendMutation.mutate(payload);
  };

  const handleSendText = () => {
    const content = draft.trim();
    if (!content) {
      return;
    }
    sendDraft({ content });
  };

  const handlePickedMedia = async (
    mediaType: Exclude<MessageMediaType, "location">,
    fallbackCaption: string,
    pick: () => Promise<{
      uri: string;
      mimeType: string;
      fileName: string;
    } | null>,
  ) => {
    if (isFieldRole) {
      setPickerError(
        "Por ahora el chat de campo solo admite texto. Contacta a oficina por otro canal si necesitas enviar un adjunto.",
      );
      return;
    }
    setPickerError(null);
    try {
      const picked = await pick();
      if (!picked) {
        return;
      }
      const caption = draft.trim() || undefined;
      sendDraft({
        content: caption ?? fallbackCaption,
        mediaType,
        mediaUrl: picked.uri,
        mimeType: picked.mimeType,
        fileName: picked.fileName,
        caption,
      });
    } catch (error) {
      setPickerError(
        error instanceof Error
          ? error.message
          : "No se pudo adjuntar el archivo.",
      );
    }
  };

  const handleShareLocation = async (outage: boolean) => {
    if (isFieldRole) {
      setPickerError(
        "Por ahora el chat de campo solo admite texto.",
      );
      return;
    }
    setPickerError(null);
    try {
      const payload = outage
        ? await buildOutageLocationDraft()
        : await buildChatLocationDraft();
      sendDraft(payload);
    } catch (error) {
      setPickerError(
        error instanceof Error
          ? error.message
          : "No se pudo compartir la ubicación.",
      );
    }
  };

  const handleToggleVoice = async () => {
    if (isFieldRole) {
      setPickerError(
        "Por ahora el chat de campo solo admite texto.",
      );
      return;
    }
    if (recorder.isRecording) {
      const recorded = await recorder.handleStop();
      if (!recorded) {
        return;
      }
      sendDraft({
        content: "Nota de voz",
        mediaType: "audio",
        mediaUrl: recorded.uri,
        mimeType: recorded.mimeType,
        fileName: `audio-${Date.now()}.m4a`,
      });
      return;
    }
    await recorder.handleStart();
  };

  const intent = readChatIntent(
    route.params && typeof route.params === "object" ? route.params : undefined,
  );

  React.useEffect(() => {
    if (isFieldRole) {
      return;
    }
    if (intent === "confirm-connection" && !confirmDraftRef.current) {
      confirmDraftRef.current = true;
      setDraft("Ya tengo internet estable.");
      return;
    }
    if (intent !== "report-outage" || outageSentRef.current) {
      return;
    }
    outageSentRef.current = true;
    const sendOutage = async () => {
      try {
        const payload = await buildOutageLocationDraft();
        sendMutation.mutate(payload);
      } catch (error) {
        setPickerError(
          error instanceof Error
            ? error.message
            : "No se pudo compartir la ubicación.",
        );
      }
    };
    void sendOutage();
  }, [intent, isFieldRole, sendMutation, setDraft]);

  const list = snapshotQuery.data?.messages ?? [];
  const humanMode = snapshotQuery.data?.conversation.humanMode ?? false;
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const headerOffset = insets.top + 56;

  React.useEffect(() => {
    if (keyboardHeight <= 0) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [keyboardHeight]);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-muted/40"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={headerOffset}
      style={
        Platform.OS === "android" ? { paddingBottom: keyboardHeight } : undefined
      }
    >
      {connectionStatus !== "live" && session ? (
        <View className="px-4 pt-3">
          <Alert icon={Radio}>
            <AlertTitle>{connectionStatusLabel(connectionStatus)}</AlertTitle>
            <AlertDescription>
              {connectionStatus === "connecting" ||
              connectionStatus === "reconnecting"
                ? "Estamos abriendo el canal en tiempo real. Los mensajes nuevos pueden tardar un momento."
                : "No hay canal en vivo ahora. El chat se actualiza cada poco mientras reintentamos la conexión."}
            </AlertDescription>
          </Alert>
        </View>
      ) : null}

      {humanMode && !isFieldRole ? (
        <View className="px-4 pt-3">
          <Alert icon={UserRound}>
            <AlertTitle>Atendido por asesor</AlertTitle>
            <AlertDescription>
              Un asesor humano está en esta conversación.
            </AlertDescription>
          </Alert>
        </View>
      ) : null}

      {isFieldRole && humanMode ? (
        <View className="px-4 pt-3">
          <Alert icon={UserRound}>
            <AlertTitle>Oficina en línea</AlertTitle>
            <AlertDescription>
              Un asesor del CRM puede responderte en este hilo.
            </AlertDescription>
          </Alert>
        </View>
      ) : null}

      <ScreenState
        isLoading={snapshotQuery.isPending}
        isEmpty={!snapshotQuery.isPending && list.length === 0}
        emptyTitle={isFieldRole ? "Sin mensajes con oficina" : "Sin mensajes"}
        emptyDescription={
          isFieldRole
            ? "Escribe a oficina para coordinar visitas o pedir apoyo."
            : "Escribe para empezar la conversación."
        }
        errorNotice={
          snapshotQuery.isError
            ? noticeFromUnknown(
                snapshotQuery.error,
                "No se pudo abrir el chat",
              )
            : null
        }
        onRetry={() => {
          void snapshotQuery.refetch();
        }}
      >
        <FlatList
          ref={listRef}
          data={list}
          keyExtractor={(item) => String(item.id)}
          className="flex-1"
          contentContainerClassName="gap-1 px-3 py-3"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            listRef.current?.scrollToEnd({ animated: true });
          }}
          renderItem={({ item, index }) => {
            const previous = index > 0 ? list[index - 1] : undefined;
            const next = list[index + 1];
            const showDay =
              !previous || !sameDay(previous.createdAt, item.createdAt);
            const showAuthor =
              item.type === "out" &&
              (!previous || !sameSenderGroup(previous, item) || showDay);
            const isLastInGroup =
              !next ||
              !sameSenderGroup(item, next) ||
              !sameDay(item.createdAt, next.createdAt);

            return (
              <View className="gap-2">
                {showDay ? (
                  <View className="items-center py-2">
                    <View className="rounded-full bg-card px-3 py-1 shadow-sm">
                      <Text className="text-[11px] font-medium text-muted-foreground">
                        {formatDayLabel(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                ) : null}
                <MessageBubble
                  message={item}
                  showAuthor={showAuthor}
                  isLastInGroup={isLastInGroup}
                />
              </View>
            );
          }}
          refreshControl={
            <RefreshControl
              refreshing={pullRefreshing}
              onRefresh={() => {
                setPullRefreshing(true);
                void snapshotQuery.refetch().finally(() => {
                  setPullRefreshing(false);
                });
              }}
            />
          }
        />
      </ScreenState>

      {failedDraft ? (
        <View className="flex-row items-center justify-between gap-3 border-t border-border bg-card px-4 py-2">
          <Text className="flex-1 text-sm text-muted-foreground">
            {sendMutation.error
              ? noticeFromUnknown(
                  sendMutation.error,
                  "No se envió el mensaje",
                ).description
              : "No se envió el mensaje. Toca Reenviar cuando tengas señal."}
          </Text>
          <Button
            variant="outline"
            size="sm"
            onPress={() => {
              retryMutation.mutate(failedDraft);
            }}
            accessibilityLabel="Reenviar"
          >
            <Text>Reenviar</Text>
          </Button>
        </View>
      ) : null}

      {recorder.errorMessage || pickerError ? (
        <View className="px-4 pb-1">
          <Text className="text-destructive text-sm">
            {recorder.errorMessage ?? pickerError}
          </Text>
        </View>
      ) : null}

      <ChatComposer
        draft={draft}
        onDraftChange={setDraft}
        isSending={sendMutation.isPending}
        isRecording={recorder.isRecording}
        recordingSeconds={recorder.elapsedSeconds}
        textOnly={isFieldRole}
        placeholder={isFieldRole ? "Escribe a oficina…" : "Mensaje"}
        onSendText={handleSendText}
        onPickImage={() => {
          void handlePickedMedia("image", "Imagen", pickChatImage);
        }}
        onTakePhoto={() => {
          void handlePickedMedia("image", "Imagen", takeChatPhoto);
        }}
        onPickVideo={() => {
          void handlePickedMedia("video", "Video", pickChatVideo);
        }}
        onPickDocument={() => {
          void handlePickedMedia("document", "Archivo", pickChatDocument);
        }}
        onShareLocation={() => {
          void handleShareLocation(false);
        }}
        onToggleVoice={() => {
          void handleToggleVoice();
        }}
      />
    </KeyboardAvoidingView>
  );
};
