import { Icon } from "@/components/ui/icon";
import { useChatUnreadStore } from "@/features/chat/chat-unread-store";
import { MessageSquare } from "lucide-react-native";
import { View } from "react-native";

type ChatTabIconProps = {
  color: string;
  size: number;
  showUnreadBadge?: boolean;
};

export const ChatTabIcon = ({
  color,
  size,
  showUnreadBadge = false,
}: ChatTabIconProps) => {
  const hasUnread = useChatUnreadStore((state) => state.hasUnread);

  return (
    <View className="items-center justify-center">
      <Icon as={MessageSquare} size={size} color={color} />
      {showUnreadBadge && hasUnread ? (
        <View
          className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-destructive"
          accessibilityLabel="Mensajes nuevos de oficina"
        />
      ) : null}
    </View>
  );
};
