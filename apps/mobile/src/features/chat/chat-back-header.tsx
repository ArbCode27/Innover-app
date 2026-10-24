import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import {
  connectionStatusLabel,
  useChannelLiveStore,
} from "@/features/chat/channel-live-store";
import { cn, withoutTextNodes } from "@/lib/utils";
import { ArrowLeft, Building2, Sparkles } from "lucide-react-native";
import * as React from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ChatBackHeaderProps = {
  onBack: () => void;
  /** Campo: Oficina / Equipo. Cliente: Nova. */
  variant?: "customer" | "field";
  title?: string;
  subtitle?: string;
};

export const ChatBackHeader = ({
  onBack,
  variant = "customer",
  title,
  subtitle,
}: ChatBackHeaderProps) => {
  const isField = variant === "field";
  const heading = title ?? (isField ? "Oficina" : "Nova");
  const defaultSub =
    subtitle ?? (isField ? "Soporte de campo" : "Asistente virtual");
  const connectionStatus = useChannelLiveStore((state) => state.status);
  const liveLabel = connectionStatusLabel(connectionStatus);
  const a11yLabel = isField
    ? `Conversación con ${heading}. ${liveLabel}`
    : `Conversación con Nova, asistente virtual. ${liveLabel}`;

  return (
    <SafeAreaView
      edges={["top"]}
      className="border-b border-border/60 bg-background"
    >
      <View className="h-14 flex-row items-center gap-1 px-2">
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={8}
          className="size-11 items-center justify-center rounded-full active:bg-muted"
        >
          <Icon as={ArrowLeft} size={22} className="text-foreground" />
        </Pressable>

        <View
          className="min-h-11 flex-1 flex-row items-center gap-2.5 pr-3"
          accessibilityRole="header"
          accessibilityLabel={a11yLabel}
        >
          <Avatar alt={heading} className="size-10 border border-primary/30">
            <AvatarFallback className="bg-primary/15">
              <Icon
                as={isField ? Building2 : Sparkles}
                size={18}
                className="text-primary"
              />
            </AvatarFallback>
          </Avatar>
          <View className="min-w-0 flex-1 gap-0.5">
            <Text
              className="text-base font-bold leading-tight text-foreground"
              numberOfLines={1}
            >
              {heading}
            </Text>
            <View className="flex-row flex-wrap items-center gap-1.5">
              {withoutTextNodes(
                <>
                  <Text
                    className="text-[11px] font-medium text-muted-foreground"
                    numberOfLines={1}
                  >
                    {defaultSub}
                  </Text>
                  <View
                    className={cn(
                      "flex-row items-center gap-1 rounded-full px-1.5 py-0.5",
                      connectionStatus === "live"
                        ? "bg-emerald-500/15"
                        : connectionStatus === "connecting" ||
                            connectionStatus === "reconnecting"
                          ? "bg-amber-500/15"
                          : "bg-muted",
                    )}
                  >
                    {withoutTextNodes(
                      <>
                        <View
                          className={cn(
                            "size-1.5 rounded-full",
                            connectionStatus === "live"
                              ? "bg-emerald-500"
                              : connectionStatus === "connecting" ||
                                  connectionStatus === "reconnecting"
                                ? "bg-amber-500"
                                : "bg-muted-foreground",
                          )}
                        />
                        <Text
                          className={cn(
                            "text-[10px] font-semibold",
                            connectionStatus === "live"
                              ? "text-emerald-700 dark:text-emerald-300"
                              : connectionStatus === "connecting" ||
                                  connectionStatus === "reconnecting"
                                ? "text-amber-700 dark:text-amber-300"
                                : "text-muted-foreground",
                          )}
                        >
                          {liveLabel}
                        </Text>
                      </>,
                    )}
                  </View>
                </>,
              )}
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};
