import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useAuthSession } from "@/features/auth/auth-session";
import { LogOut } from "lucide-react-native";
import { Pressable } from "react-native";

export const HeaderSignOutButton = () => {
  const { signOut } = useAuthSession();

  return (
    <Pressable
      onPress={() => {
        void signOut();
      }}
      accessibilityRole="button"
      accessibilityLabel="Cerrar sesión"
      hitSlop={8}
      className="min-h-11 flex-row items-center gap-1.5 rounded-full border border-border/80 bg-card/90 px-3 py-1.5 shadow-sm shadow-black/5 active:bg-muted"
    >
      <Icon as={LogOut} size={13} className="text-muted-foreground" />
      <Text className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        Salir
      </Text>
    </Pressable>
  );
};
