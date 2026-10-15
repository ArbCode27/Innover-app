import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import { ScreenState } from "@/components/screen-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AudioMessagePlayer } from "@/features/chat/audio-message-player";
import {
  fetchConversationSnapshot,
  retryFailedDraft,
  sendClientDraft,
} from "@/features/chat/app-chat-gateway";
import { pickChatImage } from "@/features/chat/image-picker";
import { useComposerStore } from "@/features/chat/composer-store";
import { useVoiceRecorder } from "@/features/chat/use-voice-recorder";
import { cn } from "@/lib/utils";
import type { ChatSnapshot } from "@/types/app-channel";
import type { AppMessage } from "@/types/domain";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image as ImageIcon, Mic, Square } from "lucide-react-native";
import * as React from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  View,
} from "react-native";

const CHAT_QUERY_KEY = ["chat-snapshot"] as const;

const formatMessageTime = (isoString?: string) => {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

const MessageBubble = ({ message }: { message: AppMessage }) => {
  const isOutbound = message.type === "out";
  const author =
    message.senderType === "bot"
      ? (message.sentBy || "Nova (IA)")
      : message.senderType === "agent"
        ? (message.sentBy || "Asesor Humano")
        : "Tú";
  const body = message.caption?.trim() || message.content;

  return (
    <View
      className={cn(
        "max-w-[85%] gap-1",
        isOutbound ? "self-start" : "self-end",
      )}
    >
      <View className="flex-row items-center gap-2">
        {isOutbound ? (
          <Avatar alt={author} className="size-7 border border-primary/30 bg-primary/10">
            <AvatarFallback>
              <Text className="text-[11px] font-bold text-primary">
                {author.slice(0, 1)}
              </Text>
            </AvatarFallback>
          </Avatar>
        ) : null}
        <Text variant="small" className="text-xs font-semibold text-muted-foreground">
          {author}
        </Text>
      </View>
      <View
        className={cn(
          "gap-2 rounded-2xl px-4 py-3 shadow-sm",
          isOutbound ? "bg-card border-border/80 border" : "bg-primary",
        )}
      >
        {message.mediaType === "image" && message.mediaUrl ? (
          <Image
            source={{ uri: message.mediaUrl }}
            className="h-44 w-52 rounded-xl"
            accessibilityLabel="Imagen enviada"
            resizeMode="cover"
          />
        ) : null}
        {message.mediaType === "audio" && message.mediaUrl ? (
          <AudioMessagePlayer uri={message.mediaUrl} inverted={!isOutbound} />
        ) : null}
        {message.mediaType === "location" ? (
          <Text
            className={
              isOutbound ? "text-card-foreground" : "text-primary-foreground"
            }
          >
            {message.locationName || "Ubicación enviada"}
          </Text>
        ) : body ? (
          <Text
            className={
              isOutbound ? "text-card-foreground" : "text-primary-foreground"
            }
          >
            {body}
          </Text>
        ) : null}
        <View className="flex-row items-center justify-end gap-1.5 pt-0.5">
          {message.status === "pending" ? (
            <Text className="text-[10px] text-muted-foreground">Enviando…</Text>
          ) : null}
          {message.status === "failed" ? (
            <Text className="text-[10px] text-destructive">No se envió</Text>
          ) : null}
          {message.createdAt ? (
            <Text
              className={cn(
                "text-[10px]",
                isOutbound ? "text-muted-foreground" : "text-primary-foreground/75",
              )}
            >
              {formatMessageTime(message.createdAt)}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export const ChatScreen = () => {
  const queryClient = useQueryClient();
  const draft = useComposerStore((state) => state.draft);
  const failedDraft = useComposerStore((state) => state.failedDraft);
  const setDraft = useComposerStore((state) => state.setDraft);
  const markFailed = useComposerStore((state) => state.markFailed);
  const clearFailed = useComposerStore((state) => state.clearFailed);
  const recorder = useVoiceRecorder();
  const [pickerError, setPickerError] = React.useState<string | null>(null);

  const snapshotQuery = useQuery({
    queryKey: CHAT_QUERY_KEY,
    queryFn: fetchConversationSnapshot,
    refetchInterval: 3000,
  });

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
          senderType: "client",
          sentBy: null,
          status: "pending",
          createdAt: new Date().toISOString(),
          mediaType: payload.mediaType,
          mediaUrl: payload.mediaUrl,
          mimeType: payload.mimeType,
          caption: payload.caption,
        };
        return {
          ...snapshot,
          messages: [...snapshot.messages, optimistic],
        };
      });
      return { previous };
    },
    onSuccess: async () => {
      setDraft("");
      setPickerError(null);
      await queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEY });
      // Invalida brevemente después para mostrar la respuesta automática simulada de Nova
      setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEY });
      }, 550);
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
    onSuccess: async () => {
      clearFailed();
      await queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEY });
    },
  });

  const handleSendText = () => {
    const content = draft.trim();
    if (!content || sendMutation.isPending) {
      return;
    }
    sendMutation.mutate({ content });
  };

  const handleSendImage = async () => {
    setPickerError(null);
    try {
      const picked = await pickChatImage();
      if (!picked) {
        return;
      }
      sendMutation.mutate({
        content: draft.trim() || "Imagen",
        mediaType: "image",
        mediaUrl: picked.uri,
        mimeType: picked.mimeType,
        fileName: picked.fileName,
        caption: draft.trim() || undefined,
      });
    } catch (error) {
      setPickerError(
        error instanceof Error ? error.message : "No se pudo adjuntar la imagen.",
      );
    }
  };

  const handleSendVoice = async () => {
    if (recorder.isRecording) {
      const recorded = await recorder.handleStop();
      if (!recorded) {
        return;
      }
      sendMutation.mutate({
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

  const list = snapshotQuery.data?.messages ?? [];
  const humanMode = snapshotQuery.data?.conversation.humanMode ?? false;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={88}
    >
      {humanMode ? (
        <View className="px-4 pt-3">
          <Badge accessibilityLabel="Atendido por asesor">
            <Text>Atendido por asesor</Text>
          </Badge>
        </View>
      ) : null}

      <ScreenState
        isLoading={snapshotQuery.isPending}
        isEmpty={!snapshotQuery.isPending && list.length === 0}
        emptyTitle="Sin mensajes"
        emptyDescription="Escribe para empezar la conversación."
        errorMessage={
          snapshotQuery.isError ? "No se pudieron cargar los mensajes." : null
        }
        onRetry={() => {
          void snapshotQuery.refetch();
        }}
      >
        <FlatList
          data={list}
          keyExtractor={(item) => String(item.id)}
          contentContainerClassName="gap-4 p-4"
          renderItem={({ item }) => <MessageBubble message={item} />}
          refreshControl={
            <RefreshControl
              refreshing={snapshotQuery.isRefetching && !snapshotQuery.isPending}
              onRefresh={() => {
                void snapshotQuery.refetch();
              }}
            />
          }
        />
      </ScreenState>

      {failedDraft ? (
        <View className="border-border bg-card gap-2 border-t px-4 py-3">
          <Text variant="muted">No se pudo enviar el último mensaje.</Text>
          <Button
            variant="outline"
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
        <View className="px-4 pt-2">
          <Text className="text-destructive">
            {recorder.errorMessage ?? pickerError}
          </Text>
        </View>
      ) : null}

      <View className="border-border bg-background gap-2 border-t p-4">
        <Textarea
          accessibilityLabel="Escribe un mensaje"
          placeholder="Escribe un mensaje"
          value={draft}
          onChangeText={setDraft}
          numberOfLines={3}
        />
        <View className="flex-row gap-2">
          <Button
            variant="outline"
            onPress={() => {
              void handleSendImage();
            }}
            accessibilityLabel="Adjuntar imagen"
          >
            <Icon as={ImageIcon} className="size-4" />
            <Text>Imagen</Text>
          </Button>
          <Button
            variant="outline"
            onPress={() => {
              void handleSendVoice();
            }}
            accessibilityLabel={
              recorder.isRecording ? "Detener grabación" : "Grabar audio"
            }
          >
            <Icon as={recorder.isRecording ? Square : Mic} className="size-4" />
            <Text>{recorder.isRecording ? "Detener" : "Audio"}</Text>
          </Button>
          <Button
            className="flex-1"
            onPress={handleSendText}
            disabled={sendMutation.isPending || draft.trim().length === 0}
            accessibilityLabel="Enviar"
          >
            <Text>{sendMutation.isPending ? "Enviando…" : "Enviar"}</Text>
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};
