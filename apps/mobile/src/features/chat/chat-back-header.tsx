import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { ArrowLeft, Sparkles } from "lucide-react-native";
import * as React from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ChatBackHeaderProps = {
  onBack: () => void;
};

export const ChatBackHeader = ({ onBack }: ChatBackHeaderProps) => {
  return (
    <SafeAreaView edges={["top"]} className="border-b border-border/60 bg-background">
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
          accessibilityLabel="Conversación con Nova, asistente virtual"
        >
          <Avatar alt="Nova" className="size-10 border border-primary/30">
            <AvatarFallback className="bg-primary/15">
              <Icon as={Sparkles} size={18} className="text-primary" />
            </AvatarFallback>
          </Avatar>
          <View className="flex-1 gap-0.5">
            <Text className="text-base font-bold leading-tight text-foreground">
              Nova
            </Text>
            <Text className="text-[11px] font-medium text-muted-foreground">
              Asistente virtual
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};
