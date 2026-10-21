import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { AudioMessagePlayer } from "@/features/chat/audio-message-player";
import { cn } from "@/lib/utils";
import type { AppMessage } from "@/types/domain";
import { Check, Clock, FileText, Film, MapPin, TriangleAlert } from "lucide-react-native";
import * as React from "react";
import { Image, Linking, Pressable, View } from "react-native";

const formatMessageTime = (isoString?: string) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("es-VE", {
    hour: "numeric",
    minute: "2-digit",
  });
};

export const formatDayLabel = (isoString: string) => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (left: Date, right: Date) =>
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();
  if (sameDay(date, today)) return "Hoy";
  if (sameDay(date, yesterday)) return "Ayer";
  return date.toLocaleDateString("es-VE", {
    day: "numeric",
    month: "long",
  });
};

const incomingAuthor = (message: AppMessage) => {
  if (message.senderType === "bot") {
    return message.sentBy || "Nova";
  }
  if (message.senderType === "agent") {
    return message.sentBy || "Asesor";
  }
  return null;
};

type MessageBubbleProps = {
  message: AppMessage;
  showAuthor: boolean;
  isLastInGroup: boolean;
};

export const MessageBubble = ({
  message,
  showAuthor,
  isLastInGroup,
}: MessageBubbleProps) => {
  const isMine = message.type === "in";
  const author = incomingAuthor(message);
  const body = message.caption?.trim() || message.content;
  const showBody =
    Boolean(body) &&
    message.mediaType !== "audio" &&
    message.mediaType !== "location";

  const handleOpenLocation = () => {
    if (message.latitude == null || message.longitude == null) {
      return;
    }
    void Linking.openURL(
      `https://maps.google.com/?q=${message.latitude},${message.longitude}`,
    );
  };

  const handleOpenMedia = () => {
    if (!message.mediaUrl) {
      return;
    }
    void Linking.openURL(message.mediaUrl);
  };

  return (
    <View
      className={cn("max-w-[82%]", isMine ? "self-end" : "self-start")}
    >
      {showAuthor && author ? (
        <Text className="mb-1 px-1 text-[11px] font-semibold text-primary">
          {author}
        </Text>
      ) : null}
      <View
        className={cn(
          "gap-1.5 px-2.5 py-1.5 shadow-sm",
          isMine
            ? "bg-secondary"
            : "border border-border/60 bg-card",
          isMine
            ? isLastInGroup
              ? "rounded-2xl rounded-br-sm"
              : "rounded-2xl"
            : isLastInGroup
              ? "rounded-2xl rounded-bl-sm"
              : "rounded-2xl",
        )}
      >
        {message.mediaType === "image" && message.mediaUrl ? (
          <Image
            source={{ uri: message.mediaUrl }}
            className="h-44 w-56 rounded-xl"
            accessibilityLabel="Imagen enviada"
            resizeMode="cover"
          />
        ) : null}
        {message.mediaType === "audio" && message.mediaUrl ? (
          <AudioMessagePlayer uri={message.mediaUrl} mine={isMine} />
        ) : null}
        {message.mediaType === "video" && message.mediaUrl ? (
          <Pressable
            onPress={handleOpenMedia}
            accessibilityRole="button"
            accessibilityLabel="Reproducir video"
            className="min-w-[200px] overflow-hidden rounded-xl bg-background"
          >
            <View className="h-28 items-center justify-center bg-primary/10">
              <Icon as={Film} size={28} className="text-primary" />
            </View>
            <View className="px-3 py-2">
              <Text className="text-sm font-semibold text-foreground">
                Video
              </Text>
              <Text className="text-xs text-muted-foreground">
                Toca para reproducir
              </Text>
            </View>
          </Pressable>
        ) : null}
        {message.mediaType === "document" && message.mediaUrl ? (
          <Pressable
            onPress={handleOpenMedia}
            accessibilityRole="button"
            accessibilityLabel="Abrir documento"
            className="min-w-[200px] flex-row items-center gap-3 overflow-hidden rounded-xl bg-background px-3 py-3"
          >
            <View className="size-11 items-center justify-center rounded-full bg-primary/10">
              <Icon as={FileText} size={20} className="text-primary" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">
                Archivo
              </Text>
              <Text className="text-xs text-muted-foreground">
                Toca para abrir
              </Text>
            </View>
          </Pressable>
        ) : null}
        {message.mediaType === "location" ? (
          <Pressable
            onPress={handleOpenLocation}
            accessibilityRole="button"
            accessibilityLabel="Abrir ubicación en Maps"
            className="min-w-[200px] overflow-hidden rounded-xl bg-background"
          >
            <View className="h-24 items-center justify-center bg-primary/10">
              <Icon as={MapPin} size={28} className="text-primary" />
            </View>
            <View className="gap-0.5 px-3 py-2">
              <Text className="text-sm font-semibold text-foreground">
                {message.locationName || "Ubicación"}
              </Text>
              <Text className="text-xs text-muted-foreground">
                Abrir en Maps
              </Text>
            </View>
          </Pressable>
        ) : null}
        {showBody ? (
          <Text className="text-[15px] leading-5 text-foreground">{body}</Text>
        ) : null}
        <View className="flex-row items-center justify-end gap-1 pt-0.5">
          {message.status === "pending" ? (
            <Icon as={Clock} size={12} className="text-muted-foreground" />
          ) : null}
          {message.status === "failed" ? (
            <View className="flex-row items-center gap-1">
              <Icon as={TriangleAlert} size={12} className="text-destructive" />
              <Text className="text-[10px] text-destructive">No se envió</Text>
            </View>
          ) : null}
          {message.createdAt ? (
            <Text className="text-[10px] text-muted-foreground">
              {formatMessageTime(message.createdAt)}
            </Text>
          ) : null}
          {isMine &&
          (message.status === "sent" ||
            message.status === "delivered" ||
            message.status === "read") ? (
            <Icon as={Check} size={12} className="text-primary" />
          ) : null}
        </View>
      </View>
    </View>
  );
};
