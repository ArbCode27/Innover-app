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
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useAuthSession } from "@/features/auth/auth-session";
import { LogOut } from "lucide-react-native";
import * as React from "react";
import { Pressable } from "react-native";

export const HeaderSignOutButton = () => {
  const { signOut } = useAuthSession();
  const [open, setOpen] = React.useState(false);

  const handleConfirm = () => {
    setOpen(false);
    void signOut();
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
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

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              Saldrás de tu cuenta de Conexiones Innover. Podrás volver a ingresar en cualquier momento con tu cédula.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onPress={() => setOpen(false)}
              accessibilityLabel="Cancelar cierre de sesión"
            >
              <Text>Cancelar</Text>
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground active:bg-destructive/90"
              onPress={handleConfirm}
              accessibilityLabel="Confirmar cierre de sesión"
            >
              <Text className="text-destructive-foreground font-bold">Cerrar sesión</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
